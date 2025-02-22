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

  it('should be able to search for user if logged in', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup('test-user-6', 'password');
    userIDs = [userResponse.id];

    const loginResponse = await authService.login('test-user-6', 'password');

    const response = await request(app)
      .get(`/users/search?username=test-user-6`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.username).toBe('test-user-6');
  });

  it('should return 404 if user not found', async () => {
    const authService = createAuthService(userStore);
    const userResponse = await authService.signup('test-user-7', 'password');
    userIDs = [userResponse.id];

    const loginResponse = await authService.login('test-user-7', 'password');

    const response = await request(app)
      .get(`/users/search?username=test-user-8`)
      .set('Accept', 'application/json')
      .set('Authorization', `${loginResponse.token}`);

    expect(response.statusCode).toBe(404);
  });
});
