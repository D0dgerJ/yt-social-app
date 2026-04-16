import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/posts', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should create a post for authenticated user', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_user',
      email: 'dodger_post_test@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    const payload = {
      desc: 'My first tested post',
      images: ['https://example.com/image-1.jpg'],
      videos: [],
      files: [],
      tags: ['Testing', 'Jest'],
      location: 'Sofia',
    };

    const response = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        userId,
        desc: payload.desc,
        images: payload.images,
        videos: payload.videos,
        files: payload.files,
        location: payload.location,
      })
    );

    expect(Array.isArray(response.body.tags)).toBe(true);
    expect(response.body.tags.length).toBeGreaterThan(0);
  });

  it('should return 401 when creating post without token', async () => {
    const response = await request(app).post('/api/v1/posts').send({
      desc: 'Unauthorized post attempt',
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