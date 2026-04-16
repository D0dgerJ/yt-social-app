import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/download/uploads/:filename (not found)', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return 404 for missing file', async () => {
    const response = await request(app).get('/api/v1/download/uploads/missing-file-12345.txt');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Файл не найден',
    });
  });
});