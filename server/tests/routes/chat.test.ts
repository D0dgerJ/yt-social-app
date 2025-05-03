import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../interfaces/app.js';

describe('Chat routes', () => {
  it('should create a chat', async () => {
    const res = await request(app).post('/api/v1/chats').send({
      senderId: 1,
      receiverId: 2,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
