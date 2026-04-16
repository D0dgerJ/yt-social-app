import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/upload', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should upload a file for authenticated user', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_upload_user',
      email: 'dodger_upload_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const response = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('hello upload world'), 'test.txt');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        urls: expect.any(Array),
      })
    );

    expect(response.body.urls.length).toBeGreaterThan(0);

    expect(response.body.urls[0]).toEqual(
      expect.objectContaining({
        url: expect.stringMatching(/^\/uploads\/.+/),
        key: expect.any(String),
        provider: expect.any(String),
        originalName: 'test.txt',
        mime: expect.any(String),
        size: expect.any(Number),
        type: 'file',
      })
    );
  });

  it('should return 400 when no files are uploaded', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_upload_empty_user',
      email: 'dodger_upload_empty_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const response = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Файлы не загружены',
    });
  });
});