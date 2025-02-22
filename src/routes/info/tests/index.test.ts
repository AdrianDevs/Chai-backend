import app from '../../../index';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('GET /info', () => {
  it('should return 200 and info', async () => {
    const response = await request(app).get('/info');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('license');
    expect(response.body).toHaveProperty('license.name');
    expect(response.body).toHaveProperty('license.url');
    expect(response.body).toHaveProperty('numOfUsers');
    expect(response.body).toHaveProperty('numOfConversations');
    expect(response.body).toHaveProperty('numOfMessages');
    expect(response.body).toHaveProperty('lastMessageAt');
  });
});
