import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/users/:id', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return public user by id', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_user_by_id',
      email: 'dodger_user_by_id@example.com',
      password: 'strong_password_123',
    });

    const userId = registerResponse.body.id as number;

    const response = await request(app).get(`/api/v1/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: userId,
        username: 'dodger_user_by_id',
      })
    );

    expect(response.body).not.toHaveProperty('email');
    expect(response.body).not.toHaveProperty('role');
  });

  it('should return 400 for invalid userId', async () => {
    const response = await request(app).get('/api/v1/users/0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid userId',
        code: 'VALIDATION',
      })
    );
  });

  it('should return null when user does not exist', async () => {
    const response = await request(app).get('/api/v1/users/999999');

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });
});