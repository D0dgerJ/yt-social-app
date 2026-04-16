import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/comments/:commentId', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return comment by id', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_by_id_user',
      email: 'dodger_comment_by_id_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comment by id testing',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Comment for getById testing',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app).get(`/api/v1/comments/${commentId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: commentId,
        postId,
        userId,
        content: 'Comment for getById testing',
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_comment_by_id_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
        }),
      })
    );

    expect(Array.isArray(response.body.likes)).toBe(true);
  });

  it('should return 400 for invalid commentId', async () => {
    const response = await request(app).get('/api/v1/comments/0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid commentId',
        code: 'VALIDATION',
      })
    );
  });

  it('should return 404 when comment does not exist', async () => {
    const response = await request(app).get('/api/v1/comments/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Comment not found',
        code: 'NOT_FOUND',
      })
    );
  });
});