import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('PUT /api/v1/posts/:id', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should update post for owner', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_update_user',
      email: 'dodger_post_update_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const createResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Original post text',
        location: 'Old City',
      });

    const postId = createResponse.body.id as number;

    const response = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Updated post text',
        location: 'New City',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: postId,
        desc: 'Updated post text',
        location: 'New City',
      })
    );
  });

  it('should return 403 when non-owner tries to update post', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_owner',
      email: 'dodger_post_owner@example.com',
      password: 'strong_password_123',
    });

    const stranger = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_stranger',
      email: 'dodger_post_stranger@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;
    const strangerToken = stranger.body.token as string;

    const createResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Owner post',
      });

    const postId = createResponse.body.id as number;

    const response = await request(app)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({
        desc: 'Hacked update attempt',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: Not the owner.',
    });
  });

  it('should return 401 when updating post without token', async () => {
    const response = await request(app).put('/api/v1/posts/1').send({
      desc: 'Unauthorized update',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});