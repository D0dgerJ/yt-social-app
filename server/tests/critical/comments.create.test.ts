import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/comments', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should create a comment for an authenticated user on an existing post', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_user',
      email: 'dodger_comment_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comment testing',
        images: [],
        videos: [],
        files: [],
        tags: ['comment-test'],
        location: 'Sofia',
      });

    const postId = postResponse.body.id as number;

    const response = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'My first tested comment',
        images: [],
        videos: [],
        files: [],
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        postId,
        userId,
        content: 'My first tested comment',
        parentId: null,
        images: [],
        videos: [],
        files: [],
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_comment_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
        }),
      })
    );

    expect(Array.isArray(response.body.likes)).toBe(true);
  });

  it('should return 401 when creating comment without token', async () => {
    const response = await request(app).post('/api/v1/comments').send({
      postId: 1,
      content: 'Unauthorized comment attempt',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 400 when content is empty', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_user',
      email: 'dodger_comment_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for empty comment testing',
      });

    const postId = postResponse.body.id as number;

    const response = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: '   ',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Content is required',
        code: 'VALIDATION',
      })
    );
  });
});