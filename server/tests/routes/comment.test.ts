import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../interfaces/app.js';

describe('Comment routes', () => {
  it('should create a comment', async () => {
    const res = await request(app).post('/api/v1/comments').send({
      postId: 1,
      userId: 1,
      text: 'Nice post!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
