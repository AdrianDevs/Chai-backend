import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import app from '../../../index';
import { db } from '../../../database/database';
import { CacheTokenManager } from '../../../cache/helpers';
import createAuthService from '../../auth/service';
import userStore from '../../users/store';
import {
  issueTokens,
  REFRESH_TOKEN_EXPIRATION,
  WEBSOCKET_TOKEN_EXPIRATION,
} from '../../../auth/helpers';

describe('POST /auth/signup', () => {
  let userID: number;

  afterEach(async () => {
    if (userID) {
      await db.deleteFrom('user').where('id', '=', userID).execute();
      const refreshTokenManager = await CacheTokenManager.getInstance();
      refreshTokenManager.invalidateRefreshToken(userID);
      refreshTokenManager.invalidateWebSocketToken(userID);
    }
  });

  it('should be able to signup a new user.', async () => {
    // runs concurrently with other tests
    const response = await request(app).post('/auth/signup').send({
      username: 'test-auth-user-1',
      password: 'password',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    expect(response.body.username).toEqual('test-auth-user-1');

    userID = response.body.id;
  });

  it('should not be able to signup two users with the same username', async () => {
    let response = await request(app).post('/auth/signup').send({
      username: 'test-auth-user-2',
      password: 'password',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    userID = response.body.id;

    response = await request(app).post('/auth/signup').send({
      username: 'test-auth-user-2',
      password: 'password',
    });

    expect(response.statusCode).toBe(409);
  });
});

describe('POST /auth/login', () => {
  const username = 'test-login-user-1';
  const password = 'password';
  let userID: number;

  beforeAll(async () => {
    const response = await request(app).post('/auth/signup').send({
      username: username,
      password: password,
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');

    userID = response.body.id;
  });

  afterAll(async () => {
    if (userID) {
      db.deleteFrom('user').where('id', '=', userID).execute();
      const refreshTokenManager = await CacheTokenManager.getInstance();
      refreshTokenManager.invalidateRefreshToken(userID);
      refreshTokenManager.invalidateWebSocketToken(userID);
    }
  });

  it('should be able to login a user', async () => {
    const response = await request(app).post('/auth/login').send({
      username: username,
      password: password,
    });

    // Check that the response is successful and contains the expected fields
    expect(response.statusCode).toBe(200);
    expect(response.body.jwt).toBeDefined();
    expect(response.body.expiresInSeconds).toBeDefined();
    expect(response.body.expiryEpoch).toBeDefined();
    expect(response.body.expiryDate).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(response.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(response.body.refreshTokenExpiryDate).toBeDefined();
    expect(response.body.webSocketToken).toBeDefined();
    expect(response.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(response.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(response.body.webSocketTokenExpiryDate).toBeDefined();

    // Validate the refresh token
    const refreshTokenManager = await CacheTokenManager.getInstance();
    const isRefreshTokenValid = await refreshTokenManager.validateRefreshToken(
      userID,
      response.body.refreshToken
    );
    expect(isRefreshTokenValid).toBe(true);

    // Validate the web socket token
    const isWebSocketTokenValid =
      await refreshTokenManager.validateWebSocketToken(
        userID,
        response.body.webSocketToken
      );
    expect(isWebSocketTokenValid).toBe(true);

    // Check that the refresh token expires in the future
    const refreshTokenExpiryDate = new Date(
      response.body.refreshTokenExpiryDate
    );
    const currentTime = new Date();
    const timeDiff = refreshTokenExpiryDate.getTime() - currentTime.getTime();
    expect(timeDiff).toBeGreaterThan(0);
    expect(timeDiff).toBeLessThan(REFRESH_TOKEN_EXPIRATION * 1000);

    // Check that the web socket token expires in the future
    const webSocketTokenExpiryDate = new Date(
      response.body.webSocketTokenExpiryDate
    );
    const timeDiffWebSocket =
      webSocketTokenExpiryDate.getTime() - currentTime.getTime();
    expect(timeDiffWebSocket).toBeGreaterThan(0);
    expect(timeDiffWebSocket).toBeLessThan(WEBSOCKET_TOKEN_EXPIRATION * 1000);

    // Invalidate the refresh token
    await refreshTokenManager.invalidateRefreshToken(userID);
    const isValidAfterInvalidation =
      await refreshTokenManager.validateRefreshToken(
        userID,
        response.body.refreshToken
      );
    expect(isValidAfterInvalidation).toBe(false);

    // Invalidate the web socket token
    await refreshTokenManager.invalidateWebSocketToken(userID);
    const isWebSocketTokenValidAfterInvalidation =
      await refreshTokenManager.validateWebSocketToken(
        userID,
        response.body.webSocketToken
      );
    expect(isWebSocketTokenValidAfterInvalidation).toBe(false);

    // Check that the refresh token is not stored after invalidation
    const refreshToken = await refreshTokenManager.getRefreshToken(userID);
    expect(refreshToken).toBeNull();

    // Check that the web socket token is not stored after invalidation
    const webSocketToken = await refreshTokenManager.getWebSocketToken(userID);
    expect(webSocketToken).toBeNull();
  });
});

describe('POST /auth/refresh-token', () => {
  const usernamePrefix = 'test-refresh-token-user-';
  const userIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      await db.deleteFrom('user').where('id', 'in', userIDs).execute();
      const refreshTokenManager = await CacheTokenManager.getInstance();
      for (const userID of userIDs) {
        refreshTokenManager.invalidateRefreshToken(userID);
        refreshTokenManager.invalidateWebSocketToken(userID);
      }
    }
  });

  it('refresh token in header and cookie should match', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    const refreshTokenFromBody = loginResponse.body.refreshToken;
    const refreshTokenFromCookie = loginResponse.headers['set-cookie']?.[0]
      .split(';')[0]
      .split('=')[1];

    const refreshTokenFromCookieEscaped = decodeURIComponent(
      refreshTokenFromCookie
    );

    expect(refreshTokenFromBody).toBe(refreshTokenFromCookieEscaped);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryDate).toBeDefined();
  });

  it('should get 200 when trying to refresh a JWT token wtih the refreshToken sent in header and cookie', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    const refreshTokenFromBody = loginResponse.body.refreshToken;
    const refreshTokenFromCookie = loginResponse.headers['set-cookie']?.[0]
      .split(';')[0]
      .split('=')[1];

    const refreshTokenFromCookieEscaped = decodeURIComponent(
      refreshTokenFromCookie
    );

    expect(refreshTokenFromBody).toBe(refreshTokenFromCookieEscaped);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryDate).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshResponse = await request(app)
      .post('/auth/refresh-tokens')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`)
      .set('x-refresh-token', loginResponse.body.refreshToken)
      .set('Cookie', `refreshToken=${loginResponse.body.refreshToken}`)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.jwt).toBeDefined();
    expect(refreshResponse.body.expiresInSeconds).toBeDefined();
    expect(refreshResponse.body.expiryEpoch).toBeDefined();
    expect(refreshResponse.body.expiryDate).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(refreshResponse.body.webSocketToken).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiryDate).toBeDefined();

    expect(refreshResponse.body.jwt).not.toBe(loginResponse.body.jwt);
    expect(refreshResponse.body.expiresInSeconds).toBe(
      loginResponse.body.expiresInSeconds
    );
    expect(refreshResponse.body.expiryEpoch).not.toBe(
      loginResponse.body.expiryEpoch
    );
    expect(refreshResponse.body.expiryDate).not.toBe(
      loginResponse.body.expiryDate
    );

    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken
    );
    expect(refreshResponse.body.refreshTokenExpiresInSeconds).toBe(
      loginResponse.body.refreshTokenExpiresInSeconds
    );
    expect(refreshResponse.body.refreshTokenExpiryEpoch).not.toBe(
      loginResponse.body.refreshTokenExpiryEpoch
    );
    expect(refreshResponse.body.refreshTokenExpiryDate).not.toBe(
      loginResponse.body.refreshTokenExpiryDate
    );

    expect(refreshResponse.body.webSocketToken).not.toBe(
      loginResponse.body.webSocketToken
    );
    expect(refreshResponse.body.webSocketTokenExpiresInSeconds).toBe(
      loginResponse.body.webSocketTokenExpiresInSeconds
    );
    expect(refreshResponse.body.webSocketTokenExpiryEpoch).not.toBe(
      loginResponse.body.webSocketTokenExpiryEpoch
    );

    const refreshTokenManager = await CacheTokenManager.getInstance();
    const isRefreshTokenValid = await refreshTokenManager.validateRefreshToken(
      userResponse.id,
      refreshResponse.body.refreshToken
    );
    expect(isRefreshTokenValid).toBe(true);
    const isWebSocketTokenValid =
      await refreshTokenManager.validateWebSocketToken(
        userResponse.id,
        refreshResponse.body.webSocketToken
      );
    expect(isWebSocketTokenValid).toBe(true);
  });

  it('should get 200 when trying to refresh a JWT token wtih the refreshToken sent in header', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    const refreshTokenFromBody = loginResponse.body.refreshToken;
    const refreshTokenFromCookie = loginResponse.headers['set-cookie']?.[0]
      .split(';')[0]
      .split('=')[1];

    const refreshTokenFromCookieEscaped = decodeURIComponent(
      refreshTokenFromCookie
    );

    expect(refreshTokenFromBody).toBe(refreshTokenFromCookieEscaped);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshResponse = await request(app)
      .post('/auth/refresh-tokens')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .set('x-refresh-token', loginResponse.body.refreshToken)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.jwt).toBeDefined();
    expect(refreshResponse.body.expiresInSeconds).toBeDefined();
    expect(refreshResponse.body.expiryEpoch).toBeDefined();
    expect(refreshResponse.body.expiryDate).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(refreshResponse.body.webSocketToken).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();

    expect(refreshResponse.body.jwt).not.toBe(loginResponse.body.jwt);
    expect(refreshResponse.body.expiresInSeconds).toBe(
      loginResponse.body.expiresInSeconds
    );
    expect(refreshResponse.body.expiryEpoch).not.toBe(
      loginResponse.body.expiryEpoch
    );
    expect(refreshResponse.body.expiryDate).not.toBe(
      loginResponse.body.expiryDate
    );

    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken
    );
    expect(refreshResponse.body.refreshTokenExpiresInSeconds).toBe(
      loginResponse.body.refreshTokenExpiresInSeconds
    );
    expect(refreshResponse.body.refreshTokenExpiryEpoch).not.toBe(
      loginResponse.body.refreshTokenExpiryEpoch
    );
    expect(refreshResponse.body.refreshTokenExpiryDate).not.toBe(
      loginResponse.body.refreshTokenExpiryDate
    );

    expect(refreshResponse.body.webSocketToken).not.toBe(
      loginResponse.body.webSocketToken
    );
    expect(refreshResponse.body.webSocketTokenExpiresInSeconds).toBe(
      loginResponse.body.webSocketTokenExpiresInSeconds
    );
    expect(refreshResponse.body.webSocketTokenExpiryEpoch).not.toBe(
      loginResponse.body.webSocketTokenExpiryEpoch
    );
    expect(refreshResponse.body.webSocketTokenExpiryDate).not.toBe(
      loginResponse.body.webSocketTokenExpiryDate
    );

    const refreshTokenManager = await CacheTokenManager.getInstance();
    const isRefreshTokenValid = await refreshTokenManager.validateRefreshToken(
      userResponse.id,
      refreshResponse.body.refreshToken
    );
    expect(isRefreshTokenValid).toBe(true);
    const isWebSocketTokenValid =
      await refreshTokenManager.validateWebSocketToken(
        userResponse.id,
        refreshResponse.body.webSocketToken
      );
    expect(isWebSocketTokenValid).toBe(true);
  });

  it('should get 200 when trying to refresh a JWT token wtih the refreshToken sent in cookie', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    const refreshTokenFromBody = loginResponse.body.refreshToken;
    const refreshTokenFromCookie = loginResponse.headers['set-cookie']?.[0]
      .split(';')[0]
      .split('=')[1];

    const refreshTokenFromCookieEscaped = decodeURIComponent(
      refreshTokenFromCookie
    );

    expect(refreshTokenFromBody).toBe(refreshTokenFromCookieEscaped);

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryDate).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshResponse = await request(app)
      .post('/auth/refresh-tokens')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`)
      .set('Cookie', `refreshToken=${loginResponse.body.refreshToken}`)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.jwt).toBeDefined();
    expect(refreshResponse.body.expiresInSeconds).toBeDefined();
    expect(refreshResponse.body.expiryEpoch).toBeDefined();
    expect(refreshResponse.body.expiryDate).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(refreshResponse.body.webSocketToken).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(refreshResponse.body.webSocketTokenExpiryDate).toBeDefined();

    expect(refreshResponse.body.jwt).not.toBe(loginResponse.body.jwt);
    expect(refreshResponse.body.expiresInSeconds).toBe(
      loginResponse.body.expiresInSeconds
    );
    expect(refreshResponse.body.expiryEpoch).not.toBe(
      loginResponse.body.expiryEpoch
    );
    expect(refreshResponse.body.expiryDate).not.toBe(
      loginResponse.body.expiryDate
    );

    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken
    );
    expect(refreshResponse.body.refreshTokenExpiresInSeconds).toBe(
      loginResponse.body.refreshTokenExpiresInSeconds
    );
    expect(refreshResponse.body.refreshTokenExpiryEpoch).not.toBe(
      loginResponse.body.refreshTokenExpiryEpoch
    );
    expect(refreshResponse.body.refreshTokenExpiryDate).not.toBe(
      loginResponse.body.refreshTokenExpiryDate
    );

    expect(refreshResponse.body.webSocketToken).not.toBe(
      loginResponse.body.webSocketToken
    );
    expect(refreshResponse.body.webSocketTokenExpiresInSeconds).toBe(
      loginResponse.body.webSocketTokenExpiresInSeconds
    );
    expect(refreshResponse.body.webSocketTokenExpiryEpoch).not.toBe(
      loginResponse.body.webSocketTokenExpiryEpoch
    );
    expect(refreshResponse.body.webSocketTokenExpiryDate).not.toBe(
      loginResponse.body.webSocketTokenExpiryDate
    );

    const refreshTokenManager = await CacheTokenManager.getInstance();
    const isValid = await refreshTokenManager.validateRefreshToken(
      userResponse.id,
      refreshResponse.body.refreshToken
    );
    expect(isValid).toBe(true);
  });

  it('should get 401 when trying to refresh a JWT token when the refreshToken is not valid', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryDate).toBeDefined();

    const invalidateResponse = await request(app)
      .post('/auth/revoke-tokens')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`)
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(invalidateResponse.statusCode).toBe(200);

    const refreshResponse = await request(app)
      .post('/auth/refresh-tokens')
      .set('x-refresh-token', loginResponse.body.jwt)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(401);
  });

  it('verify JWT expiry', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const jwtToken = issueTokens(userResponse, 1);
    expect(jwtToken.expiresInSeconds).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await request(app)
      .post('/auth/revoke-tokens')
      .set('Authorization', jwtToken.token)
      .send({ userID: userResponse.id });

    expect(response.statusCode).toBe(401);
  });

  it('verify refresh token and webSocket token expiry', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    const refreshTokenFromBody = loginResponse.body.refreshToken;
    const webSocketTokenFromBody = loginResponse.body.webSocketToken;

    const tokenManager = await CacheTokenManager.getInstance();
    const refreshTokenFromCache = await tokenManager.getRefreshToken(
      userResponse.id
    );
    const webSocketTokenFromCache = await tokenManager.getWebSocketToken(
      userResponse.id
    );

    expect(refreshTokenFromBody).toBeDefined();
    expect(refreshTokenFromCache).toBeDefined();
    expect(refreshTokenFromBody).toBe(refreshTokenFromCache);

    expect(webSocketTokenFromBody).toBeDefined();
    expect(webSocketTokenFromCache).toBeDefined();
    expect(webSocketTokenFromBody).toBe(webSocketTokenFromCache);

    await tokenManager.setRefreshTokenExpiration(userResponse.id, 1);
    await tokenManager.setWebSocketTokenExpiration(userResponse.id, 1);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshTokenFromCache2 = await tokenManager.getRefreshToken(
      userResponse.id
    );
    expect(refreshTokenFromCache2).toBeNull();

    const webSocketTokenFromCache2 = await tokenManager.getWebSocketToken(
      userResponse.id
    );
    expect(webSocketTokenFromCache2).toBeNull();

    const refreshResponse = await request(app)
      .post('/auth/refresh-tokens')
      .set('x-refresh-token', refreshTokenFromBody)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(401);
  });
});

describe('POST /auth/revoke-token', () => {
  const usernamePrefix = 'test-revoke-token-user-';
  const userIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      await db.deleteFrom('user').where('id', 'in', userIDs).execute();
      const refreshTokenManager = await CacheTokenManager.getInstance();
      for (const userID of userIDs) {
        refreshTokenManager.invalidateRefreshToken(userID);
        refreshTokenManager.invalidateWebSocketToken(userID);
      }
    }
  });

  it('should get 200 when trying to revoke a refresh token when the refresh token is not valid', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();

    const invalidateResponse = await request(app)
      .post('/auth/revoke-tokens')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`)
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(invalidateResponse.statusCode).toBe(200);

    const revokeResponse = await request(app)
      .post('/auth/revoke-tokens')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`)
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(revokeResponse.statusCode).toBe(200);
  });

  it('should get 200 when trying to revoke a refrsh token when the refresh token is valid', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();

    const revokeResponse = await request(app)
      .post('/auth/revoke-tokens')
      .set('Authorization', `Bearer ${loginResponse.body.jwt}`)
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(revokeResponse.statusCode).toBe(200);
  });

  it('should get 401 when trying to revoke a refresh token when the JWT token is not valid', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs.push(userResponse.id);

    const loginResponse = await request(app).post('/auth/login').send({
      username: userResponse.username,
      password: 'password',
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.jwt).toBeDefined();
    expect(loginResponse.body.expiresInSeconds).toBeDefined();
    expect(loginResponse.body.expiryEpoch).toBeDefined();
    expect(loginResponse.body.expiryDate).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.refreshTokenExpiryDate).toBeDefined();
    expect(loginResponse.body.webSocketToken).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiresInSeconds).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryEpoch).toBeDefined();
    expect(loginResponse.body.webSocketTokenExpiryDate).toBeDefined();

    const revokeResponse = await request(app)
      .post('/auth/revoke-tokens')
      .set('Authorization', 'invalid-token')
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(revokeResponse.statusCode).toBe(401);
  });
});
