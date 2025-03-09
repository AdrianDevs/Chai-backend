import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import app from '../../../index';
import { db } from '../../../database/database';
import { RefreshTokenManager } from '../../../cache/helpers';
import createAuthService from '../../auth/service';
import userStore from '../../users/store';
import { issueJWT } from '../../../auth/helpers';

describe('POST /auth/signup', () => {
  let userID: number;

  afterEach(async () => {
    if (userID) {
      await db.deleteFrom('user').where('id', '=', userID).execute();
      const refreshTokenManager = await RefreshTokenManager.getInstance();
      refreshTokenManager.invalidateRefreshToken(userID);
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
      const refreshTokenManager = await RefreshTokenManager.getInstance();
      refreshTokenManager.invalidateRefreshToken(userID);
    }
  });

  it('should be able to login a user', async () => {
    const response = await request(app).post('/auth/login').send({
      username: username,
      password: password,
    });

    // Check that the response is successful and contains the expected fields
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshTokenExpires).toBeDefined();

    // Validate the refresh token
    const refreshTokenManager = await RefreshTokenManager.getInstance();
    const isValid = await refreshTokenManager.validateRefreshToken(
      userID,
      response.body.refreshToken
    );
    expect(isValid).toBe(true);

    // Check that the refresh token expires in the future
    const refreshTokenExpires = new Date(response.body.refreshTokenExpires);
    const currentTime = new Date();
    const timeDiff = refreshTokenExpires.getTime() - currentTime.getTime();
    expect(timeDiff).toBeGreaterThan(0);
    expect(timeDiff).toBeLessThan(7 * 24 * 60 * 60 * 1000);

    // Invalidate the refresh token
    await refreshTokenManager.invalidateRefreshToken(userID);
    const isValidAfterInvalidation =
      await refreshTokenManager.validateRefreshToken(
        userID,
        response.body.refreshToken
      );
    expect(isValidAfterInvalidation).toBe(false);

    // Check that the refresh token is not stored after invalidation
    const refreshToken = await refreshTokenManager.getRefreshToken(userID);
    expect(refreshToken).toBeNull();
  });
});

describe('POST /auth/refresh-token', () => {
  const usernamePrefix = 'test-refresh-token-user-';
  const userIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      await db.deleteFrom('user').where('id', 'in', userIDs).execute();
      const refreshTokenManager = await RefreshTokenManager.getInstance();
      for (const userID of userIDs) {
        refreshTokenManager.invalidateRefreshToken(userID);
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshResponse = await request(app)
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .set('x-refresh-token', loginResponse.body.refreshToken)
      .set('Cookie', `refreshToken=${loginResponse.body.refreshToken}`)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.token).toBeDefined();
    expect(refreshResponse.body.expiresIn).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpires).toBeDefined();

    expect(refreshResponse.body.token).not.toBe(loginResponse.body.token);
    expect(refreshResponse.body.expiresIn).toBe(loginResponse.body.expiresIn);
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken
    );
    expect(refreshResponse.body.refreshTokenExpires).not.toBe(
      loginResponse.body.refreshTokenExpires
    );

    const refreshTokenManager = await RefreshTokenManager.getInstance();
    const isValid = await refreshTokenManager.validateRefreshToken(
      userResponse.id,
      refreshResponse.body.refreshToken
    );
    expect(isValid).toBe(true);
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshResponse = await request(app)
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .set('x-refresh-token', loginResponse.body.refreshToken)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.token).toBeDefined();
    expect(refreshResponse.body.expiresIn).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpires).toBeDefined();

    expect(refreshResponse.body.token).not.toBe(loginResponse.body.token);
    expect(refreshResponse.body.expiresIn).toBe(loginResponse.body.expiresIn);
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken
    );
    expect(refreshResponse.body.refreshTokenExpires).not.toBe(
      loginResponse.body.refreshTokenExpires
    );

    const refreshTokenManager = await RefreshTokenManager.getInstance();
    const isValid = await refreshTokenManager.validateRefreshToken(
      userResponse.id,
      refreshResponse.body.refreshToken
    );
    expect(isValid).toBe(true);
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshResponse = await request(app)
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .set('Cookie', `refreshToken=${loginResponse.body.refreshToken}`)
      .send({ userID: userResponse.id });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body.token).toBeDefined();
    expect(refreshResponse.body.expiresIn).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
    expect(refreshResponse.body.refreshTokenExpires).toBeDefined();

    expect(refreshResponse.body.token).not.toBe(loginResponse.body.token);
    expect(refreshResponse.body.expiresIn).toBe(loginResponse.body.expiresIn);
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken
    );
    expect(refreshResponse.body.refreshTokenExpires).not.toBe(
      loginResponse.body.refreshTokenExpires
    );

    const refreshTokenManager = await RefreshTokenManager.getInstance();
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    const invalidateResponse = await request(app)
      .post('/auth/revoke-token')
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.body.token}`)
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(invalidateResponse.statusCode).toBe(200);

    const refreshResponse = await request(app)
      .post('/auth/refresh-token')
      .set('x-refresh-token', loginResponse.body.refreshToken)
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

    const jwtToken = issueJWT(userResponse, 1);
    expect(jwtToken.expires).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await request(app)
      .post('/auth/revoke-token')
      .set('Authorization', jwtToken.token)
      .send({ userID: userResponse.id });

    expect(response.statusCode).toBe(401);
  });

  it('verify refresh token expiry', async () => {
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
    const refreshTokenManager = await RefreshTokenManager.getInstance();
    const refreshTokenFromCache = await refreshTokenManager.getRefreshToken(
      userResponse.id
    );

    expect(refreshTokenFromBody).toBeDefined();
    expect(refreshTokenFromCache).toBeDefined();
    expect(refreshTokenFromBody).toBe(refreshTokenFromCache);

    await refreshTokenManager.setRefreshTokenExpiration(userResponse.id, 1);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const refreshTokenFromCache2 = await refreshTokenManager.getRefreshToken(
      userResponse.id
    );

    expect(refreshTokenFromCache2).toBeNull();

    const refreshResponse = await request(app)
      .post('/auth/refresh-token')
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
      const refreshTokenManager = await RefreshTokenManager.getInstance();
      for (const userID of userIDs) {
        refreshTokenManager.invalidateRefreshToken(userID);
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    const invalidateResponse = await request(app)
      .post('/auth/revoke-token')
      .set('Authorization', `${loginResponse.body.token}`)
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(invalidateResponse.statusCode).toBe(200);

    const revokeResponse = await request(app)
      .post('/auth/revoke-token')
      .set('Authorization', `${loginResponse.body.token}`)
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    const revokeResponse = await request(app)
      .post('/auth/revoke-token')
      .set('Authorization', `${loginResponse.body.token}`)
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
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.expiresIn).toBeDefined();
    expect(loginResponse.body.refreshToken).toBeDefined();
    expect(loginResponse.body.refreshTokenExpires).toBeDefined();

    const revokeResponse = await request(app)
      .post('/auth/revoke-token')
      .set('Authorization', 'invalid-token')
      .set('x-refresh-token', loginResponse.body.refreshToken);

    expect(revokeResponse.statusCode).toBe(401);
  });
});
