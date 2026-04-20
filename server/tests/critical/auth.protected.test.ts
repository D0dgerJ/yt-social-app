import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('Protected routes auth guard', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app).get('/api/v1/users/profile');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
  
    it('should return 400 for invalid email', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      username: 'valid_username',
      email: 'invalid-email',
      password: 'strong_password_123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid email',
      })
    );
  });

  it('should return 400 for short username', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      username: 'ab',
      email: 'valid@example.com',
      password: 'strong_password_123',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Username must be at least 3 characters',
      })
    );
  });

  it('should return 400 for short password', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      username: 'valid_username',
      email: 'valid@example.com',
      password: '12345',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Password must be at least 6 characters',
      })
    );
  });
});