import app from '../../../index';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import createAuthService from '../../auth/service';
import userStore from '../store';
import { db } from '../../../database/database';

describe('GET /users', () => {
  let userIDs: number[] = [];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('should not be able to view user info if not logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup('test-user-1', 'password');
    userIDs = [userResponse.id];
    const response = await request(app).get(`/users/${userIDs[0]}`);
    expect(response.statusCode).toBe(401);
  });

  it('should be able to view own user info if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup('test-user-2', 'password');
    userIDs = [userResponse.id];

    const loginResponse = await authService.login('test-user-2', 'password');

    const response = await request(app)
      .get(`/users/${userIDs[0]}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(userIDs[0]);
    expect(response.body.username).toBe('test-user-2');
  });

  it('should not be able to view other user info if logged in', async () => {
    const authService = createAuthService(userStore);
    let userResponse = await authService.signup('test-user-3', 'password');
    userIDs = [userResponse.id];
    userResponse = await authService.signup('test-user-4', 'password');
    userIDs.push(userResponse.id);

    const loginResponse = await authService.login('test-user-3', 'password');

    const response = await request(app)
      .get(`/users/${userIDs[1]}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(403);
  });
});

describe('GET /users/search', () => {
  const usernamePrefix = 'test-user-search-user';
  let userIDs: number[];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('should not be able to search for user if not logged in', async () => {
    const response = await request(app).get(
      `/users/search?username=test-user-5`
    );
    expect(response.statusCode).toBe(401);
  });

  it('should be able to search for a single user if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const loginResponse = await authService.login(
      userResponse.username,
      'password'
    );

    const response = await request(app)
      .get(`/users/search?usernames=${userResponse.username}`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(userResponse.id);
    expect(response.body[0].username).toBe(userResponse.username);
  });

  it.only('should be able to search for multiple users if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse1 = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    const userResponse2 = await authService.signup(
      `${usernamePrefix}2`,
      'password'
    );
    userIDs = [userResponse1.id, userResponse2.id];

    const loginResponse = await authService.login(
      userResponse1.username,
      'password'
    );

    const response = await request(app)
      .get(
        `/users/search?usernames=${userResponse1.username}&usernames=${userResponse2.username}`
      )
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].id).toBe(userResponse1.id);
    expect(response.body[0].username).toBe(userResponse1.username);
    expect(response.body[1].id).toBe(userResponse2.id);
    expect(response.body[1].username).toBe(userResponse2.username);
  });
});

describe('GET /users/validate', () => {
  const usernamePrefix = 'test-user-validate-user';
  let userIDs: number[];

  afterEach(async () => {
    if (userIDs && userIDs.length > 0) {
      for (const userID of userIDs) {
        await db.deleteFrom('user').where('id', '=', userID).execute();
      }
    }
  });

  it('user name should be taken if in use', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const response = await request(app).get(
      `/users/validate?username=${userResponse.username}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('taken');
  });

  it('user name should be available if not in use', async () => {
    const authService = createAuthService(userStore);

    const userResponse = await authService.signup(
      `${usernamePrefix}1`,
      'password'
    );
    userIDs = [userResponse.id];

    const response = await request(app).get(
      `/users/validate?username=${userResponse.username}1`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('available');
  });
});
