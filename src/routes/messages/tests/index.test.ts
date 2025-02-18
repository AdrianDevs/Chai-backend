import app from '../../../index';
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
import { db } from '../../../database/database';

describe('GET /messages', () => {
  let userID: number;

  beforeAll(() => {
    // Set up test environment
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

  it('should not be able to view messages if not logged in', async () => {
    // runs concurrently with other tests
    const response = await request(app).get('/messages');

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(401);
  });

  it('should be able to view messages if logged in', async () => {
    let response = await request(app).post('/auth/signup').send({
      username: 'test-message-user',
      password: 'password',
    });

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBeTypeOf('number');
    expect(response.body.username).toEqual('test-message-user');
    expect(response.body.token).toBeDefined();
    expect(response.body.expiresIn).toBeDefined();
    userID = response.body.id;
    const token = response.body.token;

    response = await request(app)
      .get('/messages')
      .set('Accept', 'application/json')
      .set('Authorization', `${token}`);

    // eslint-disable-next-line no-console
    console.log('response status code', response.statusCode);
    // eslint-disable-next-line no-console
    console.log('response body', response.body);

    expect(response.statusCode).toBe(200);
  });
});
