import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../interfaces/app';

describe('Auth routes', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
