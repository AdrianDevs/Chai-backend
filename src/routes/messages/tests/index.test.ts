import app from '../../../index';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../../../database/database';

describe('GET /messages', () => {
  let userID: number;

  afterEach(async () => {
    if (userID) {
      await db.deleteFrom('user').where('id', '=', userID).execute();
    }
  });

  it('should not be able to view messages if not logged in', async () => {
    const response = await request(app).get('/messages');
    expect(response.statusCode).toBe(401);
  });

  it('should be able to view messages if logged in', async () => {
    let response = await request(app).post('/auth/signup').send({
      username: 'test-message-user',
      password: 'password',
    });

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

    expect(response.statusCode).toBe(200);
  });
});
