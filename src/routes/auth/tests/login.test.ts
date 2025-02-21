import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../../index';
import { db } from '../../../database/database';

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

  afterAll(() => {
    if (userID) {
      db.deleteFrom('user').where('id', '=', userID).execute();
    }
  });

  it('should be able to login a user', async () => {
    const response = await request(app).post('/auth/login').send({
      username: username,
      password: password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
  });
});
