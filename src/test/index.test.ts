import app from '../index';
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

describe('GET /health', () => {
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
  });

  it('should return 200 and the correct dataa.', async () => {
    // runs concurrently with other tests
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'UP' });
  });
});
