import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import app from '../../../index';
import { db } from '../../../database/database';

describe('POST /auth/signup', () => {
  let userID: number;

  afterEach(async () => {
    if (userID) {
      await db.deleteFrom('user').where('id', '=', userID).execute();
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

  it('should be automatically logged in after signing up', async () => {
    const response = await request(app).post('/auth/signup').send({
      username: 'test-auth-user-3',
      password: 'password',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    expect(response.body.username).toEqual('test-auth-user-3');
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
    userID = response.body.id;
  });
});
