import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/posts/:id', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return post by id', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_get_user',
      email: 'dodger_post_get_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const createResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for getById testing',
        images: [],
        videos: [],
        files: [],
        tags: ['get-by-id'],
        location: 'Sofia',
      });

    const postId = createResponse.body.id as number;

    const response = await request(app).get(`/api/v1/posts/${postId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: postId,
        userId,
        desc: 'Post for getById testing',
        images: [],
        videos: [],
        files: [],
        location: 'Sofia',
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_post_get_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
          comments: expect.any(Number),
        }),
      })
    );

    expect(Array.isArray(response.body.likes)).toBe(true);
    expect(Array.isArray(response.body.savedBy)).toBe(true);
  });

  it('should return 400 for invalid postId', async () => {
    const response = await request(app).get('/api/v1/posts/0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid post ID',
        code: 'VALIDATION',
      })
    );
  });

  it('should return 404 when post does not exist', async () => {
    const response = await request(app).get('/api/v1/posts/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Post not found',
        code: 'NOT_FOUND',
      })
    );
  });
});