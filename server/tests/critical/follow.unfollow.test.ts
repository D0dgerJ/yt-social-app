import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('PUT /api/v1/users/:id/follow and /unfollow', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should follow another user', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_follow_user_1',
      email: 'dodger_follow_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_follow_user_2',
      email: 'dodger_follow_user_2@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;
    const targetUserId = secondUser.body.id as number;

    const response = await request(app)
      .put(`/api/v1/users/${targetUserId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Followed successfully',
    });
  });

  it('should return 409 when following same user twice', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_follow_user_1',
      email: 'dodger_follow_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_follow_user_2',
      email: 'dodger_follow_user_2@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;
    const targetUserId = secondUser.body.id as number;

    await request(app)
      .put(`/api/v1/users/${targetUserId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    const secondResponse = await request(app)
      .put(`/api/v1/users/${targetUserId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toEqual(
      expect.objectContaining({
        message: 'You already follow this user',
        code: 'CONFLICT',
      })
    );
  });

  it('should unfollow user after follow', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_follow_user_1',
      email: 'dodger_follow_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_follow_user_2',
      email: 'dodger_follow_user_2@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;
    const targetUserId = secondUser.body.id as number;

    await request(app)
      .put(`/api/v1/users/${targetUserId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    const unfollowResponse = await request(app)
      .put(`/api/v1/users/${targetUserId}/unfollow`)
      .set('Authorization', `Bearer ${token}`);

    expect(unfollowResponse.status).toBe(200);
    expect(unfollowResponse.body).toEqual({
      message: 'Unfollowed successfully',
    });
  });

  it('should return 400 when trying to follow yourself', async () => {
    const user = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_self_follow_user',
      email: 'dodger_self_follow_user@example.com',
      password: 'strong_password_123',
    });

    const token = user.body.token as string;
    const userId = user.body.id as number;

    const response = await request(app)
      .put(`/api/v1/users/${userId}/follow`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'You cannot follow yourself',
        code: 'VALIDATION',
      })
    );
  });
});