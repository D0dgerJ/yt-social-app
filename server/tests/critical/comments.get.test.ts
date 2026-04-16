import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/comments/post/:postId', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return post comments with nested replies', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comments_get_user',
      email: 'dodger_comments_get_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comments get testing',
      });

    const postId = postResponse.body.id as number;

    const rootCommentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Root comment for get test',
      });

    const rootCommentId = rootCommentResponse.body.id as number;

    await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        parentId: rootCommentId,
        content: 'Reply for get test',
      });

    const response = await request(app).get(`/api/v1/comments/post/${postId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const rootComment = response.body.find((comment: any) => comment.id === rootCommentId);

    expect(rootComment).toBeDefined();
    expect(rootComment).toEqual(
      expect.objectContaining({
        id: rootCommentId,
        postId,
        userId,
        content: 'Root comment for get test',
        parentId: null,
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_comments_get_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
        }),
      })
    );

    expect(Array.isArray(rootComment.likes)).toBe(true);
    expect(Array.isArray(rootComment.replies)).toBe(true);
    expect(rootComment.replies.length).toBe(1);

    expect(rootComment.replies[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        postId,
        userId,
        parentId: rootCommentId,
        content: 'Reply for get test',
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_comments_get_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
        }),
      })
    );

    expect(Array.isArray(rootComment.replies[0].likes)).toBe(true);
  });

  it('should return 400 for invalid postId', async () => {
    const response = await request(app).get('/api/v1/comments/post/0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid postId',
        code: 'VALIDATION',
      })
    );
  });

  it('should return empty array when post has no comments', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comments_empty_user',
      email: 'dodger_comments_empty_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post without comments',
      });

    const postId = postResponse.body.id as number;

    const response = await request(app).get(`/api/v1/comments/post/${postId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});