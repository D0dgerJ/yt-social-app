import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('PUT /api/v1/comments/:commentId/like', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should like a comment for authenticated user', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_like_user',
      email: 'dodger_comment_like_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comment like testing',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Comment to like',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .put(`/api/v1/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      liked: true,
    });
  });

  it('should remove comment like on second toggle', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_like_user',
      email: 'dodger_comment_like_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comment unlike testing',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Comment to unlike',
      });

    const commentId = commentResponse.body.id as number;

    await request(app)
      .put(`/api/v1/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${token}`);

    const secondResponse = await request(app)
      .put(`/api/v1/comments/${commentId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body).toEqual({
      liked: false,
    });
  });

  it('should return 401 when liking comment without token', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_like_user',
      email: 'dodger_comment_like_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for unauthorized comment like testing',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Comment for unauthorized like',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app).put(`/api/v1/comments/${commentId}/like`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});