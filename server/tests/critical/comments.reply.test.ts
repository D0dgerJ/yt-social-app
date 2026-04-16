import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/comments (reply flow)', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should create a reply to an existing comment', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_reply_user',
      email: 'dodger_reply_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for reply testing',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Root comment',
      });

    const parentId = commentResponse.body.id as number;

    const replyResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        parentId,
        content: 'Reply to root comment',
      });

    expect(replyResponse.status).toBe(201);
    expect(replyResponse.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        postId,
        userId,
        parentId,
        content: 'Reply to root comment',
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_reply_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
        }),
      })
    );

    expect(Array.isArray(replyResponse.body.likes)).toBe(true);
  });

  it('should return 404 when parent comment does not exist', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
        username: 'dodger_reply_user',
        email: 'dodger_reply_test@example.com',
        password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
        desc: 'Post for invalid parentId testing',
        });

    const postId = postResponse.body.id as number;

    const response = await request(app)
        .post('/api/v1/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
        postId,
        parentId: 999999,
        content: 'Reply with invalid parentId',
        });

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
        expect.objectContaining({
        message: 'Comment not found',
        code: 'NOT_FOUND',
        })
    );
    });

  it('should return 400 when parent comment belongs to another post', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_reply_user',
      email: 'dodger_reply_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const firstPostResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'First post',
      });

    const secondPostResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Second post',
      });

    const firstPostId = firstPostResponse.body.id as number;
    const secondPostId = secondPostResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: firstPostId,
        content: 'Comment on first post',
      });

    const parentId = commentResponse.body.id as number;

    const response = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: secondPostId,
        parentId,
        content: 'Reply attached to wrong post',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid parentId for this post',
        code: 'VALIDATION',
      })
    );
  });

  it('should return 401 when creating reply without token', async () => {
    const response = await request(app).post('/api/v1/comments').send({
      postId: 1,
      parentId: 1,
      content: 'Unauthorized reply attempt',
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