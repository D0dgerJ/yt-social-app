import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/posts/feed', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return feed posts for authenticated user', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_feed_user',
      email: 'dodger_feed_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post that should appear in feed',
        images: [],
        videos: [],
        files: [],
        tags: ['feed-test'],
        location: 'Sofia',
      });

    const createdPostId = postResponse.body.id as number;

    const response = await request(app)
      .get('/api/v1/posts/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const foundPost = response.body.find((post: any) => post.id === createdPostId);

    expect(foundPost).toBeDefined();
    expect(foundPost).toEqual(
      expect.objectContaining({
        id: createdPostId,
        userId,
        desc: 'Post that should appear in feed',
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_feed_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
          comments: expect.any(Number),
        }),
      })
    );
  });

  it('should return 401 when requesting feed without token', async () => {
    const response = await request(app).get('/api/v1/posts/feed');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});