import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../interfaces/app';

describe('Story routes', () => {
  it('should create a story', async () => {
    const res = await request(app).post('/api/v1/stories').send({
      userId: 1,
      img: 'https://example.com/story.jpg',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
