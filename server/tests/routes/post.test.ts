import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../interfaces/app';

describe('Post routes', () => {
  it('should create a post', async () => {
    const res = await request(app).post('/api/v1/posts').send({
      userId: 1,
      desc: 'My test post',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
