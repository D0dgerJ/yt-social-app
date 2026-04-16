import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/download/uploads/:filename', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should download previously uploaded file', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_download_user',
      email: 'dodger_download_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;
    const fileContent = 'hello downloadable file';

    const uploadResponse = await request(app)
      .post('/api/v1/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(fileContent), 'download-test.txt');

    expect(uploadResponse.status).toBe(200);

    const uploadedUrl = uploadResponse.body.urls[0].url as string;
    const filename = uploadedUrl.split('/').pop();

    const downloadResponse = await request(app).get(`/api/v1/download/uploads/${filename}`);

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.text).toBe(fileContent);
    expect(downloadResponse.headers['content-type']).toBeDefined();
  });
});