import app from '../index';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('GET /', () => {
  it('should return 200 and the correct data.', async () => {
    // runs concurrently with other tests
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Hello World' });
  });
});

describe('GET /health', () => {
  it('should return 200 and the correct data.', async () => {
    // runs concurrently with other tests
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'UP' });
  });
});
