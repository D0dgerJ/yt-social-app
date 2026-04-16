import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/posts/search', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return matching posts by text query', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_search_user',
      email: 'dodger_post_search_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.id as number;

    await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Unique galaxy banana query text',
      });

    await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Something completely different',
      });

    const response = await request(app).get('/api/v1/posts/search?q=galaxy banana');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
      })
    );

    expect(response.body.items.length).toBeGreaterThan(0);

    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        userId,
        desc: expect.stringContaining('galaxy banana'),
        user: expect.objectContaining({
          id: userId,
          username: 'dodger_post_search_user',
        }),
        _count: expect.objectContaining({
          likes: expect.any(Number),
          comments: expect.any(Number),
        }),
      })
    );
  });

  it('should return empty items for empty query', async () => {
    const response = await request(app).get('/api/v1/posts/search?q=');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
    });
  });

  it('should respect limit and return items array', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_search_limit_user',
      email: 'dodger_post_search_limit_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ desc: 'limit test alpha' });

    await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ desc: 'limit test beta' });

    const response = await request(app).get('/api/v1/posts/search?q=limit test&limit=1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
      })
    );

    expect(response.body.items.length).toBeLessThanOrEqual(1);
  });
});