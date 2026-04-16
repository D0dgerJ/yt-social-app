import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/users/username/:username', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return user by username', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_user_by_username',
      email: 'dodger_user_by_username@example.com',
      password: 'strong_password_123',
    });

    const response = await request(app).get('/api/v1/users/username/dodger_user_by_username');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        username: 'dodger_user_by_username',
        email: 'dodger_user_by_username@example.com',
        followersCount: expect.any(Number),
        followingCount: expect.any(Number),
        isFriend: expect.any(Boolean),
        friendRequestStatus: expect.any(String),
      })
    );
  });

  it('should return 400 for invalid username', async () => {
    const response = await request(app).get('/api/v1/users/username/');

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should return 500 when username does not exist', async () => {
    const response = await request(app).get('/api/v1/users/username/missing_user_123456');

    expect(response.status).toBe(500);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Internal server error',
        code: 'INTERNAL',
      })
    );
  });
});