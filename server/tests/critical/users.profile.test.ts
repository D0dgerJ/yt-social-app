import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/users/profile', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return current user profile for authenticated user', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_profile_user',
      email: 'dodger_profile_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: userId,
        username: 'dodger_profile_user',
        email: 'dodger_profile_test@example.com',
        role: expect.any(String),
      })
    );
  });

  it('should return 401 without token', async () => {
    const response = await request(app).get('/api/v1/users/profile');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 401 with invalid token', async () => {
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
});