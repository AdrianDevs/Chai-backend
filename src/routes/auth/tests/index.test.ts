import request from 'supertest';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import app from '../../../index';
import { db } from '../../../database/database';

describe('POST /auth/signup', () => {
  let userID: number;

  beforeAll(() => {
    // Set up test environment
    // db.deleteFrom('users').execute();
  });

  beforeEach(() => {
    // Set up before each test
  });

  afterAll(() => {
    // Clean up after all tests
  });

  afterEach(() => {
    // Clean up after each test
    if (userID) {
      db.deleteFrom('users').where('id', '=', userID).execute();
    }
  });

  it('should be able to signup a new user.', async () => {
    // runs concurrently with other tests
    const response = await request(app).post('/auth/signup').send({
      username: 'test-auth-1',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    expect(response.body.username).toEqual('test-auth-1');

    userID = response.body.id;
  });

  it('should not be able to signup two users with the same username', async () => {
    let response = await request(app).post('/auth/signup').send({
      username: 'test-auth-2',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    userID = response.body.id;

    response = await request(app).post('/auth/signup').send({
      username: 'test-auth-2',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(500);
  });

  it('should be able to login a user', async () => {
    let response = await request(app).post('/auth/signup').send({
      username: 'test-user-3',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    userID = response.body.id;

    response = await request(app).post('/auth/login').send({
      username: 'test-user-3',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
  });

  it('should be automatically logged in after signing up', async () => {
    const response = await request(app).post('/auth/signup').send({
      username: 'test-user-4',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    expect(response.body.username).toEqual('test-user-4');
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
    userID = response.body.id;
  });
});
