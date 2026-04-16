import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('GET /api/v1/users/search', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return matching users and exclude current user', async () => {
    const currentUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_search_me',
      email: 'dodger_search_me@example.com',
      password: 'strong_password_123',
    });

    await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_search_target',
      email: 'dodger_search_target@example.com',
      password: 'strong_password_123',
    });

    await request(app).post('/api/v1/auth/register').send({
      username: 'another_person',
      email: 'another_person@example.com',
      password: 'strong_password_123',
    });

    const token = currentUser.body.token as string;

    const response = await request(app)
      .get('/api/v1/users/search?q=dodger_search')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
      })
    );

    const usernames = response.body.items.map((user: any) => user.username);

    expect(usernames).toContain('dodger_search_target');
    expect(usernames).not.toContain('dodger_search_me');
    expect(usernames).not.toContain('another_person');
  });

  it('should return empty items for empty query', async () => {
    const currentUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_empty_search_user',
      email: 'dodger_empty_search_user@example.com',
      password: 'strong_password_123',
    });

    const token = currentUser.body.token as string;

    const response = await request(app)
      .get('/api/v1/users/search?q=')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [],
    });
  });

  it('should respect limit', async () => {
    const currentUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_limit_search_me',
      email: 'dodger_limit_search_me@example.com',
      password: 'strong_password_123',
    });

    await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_limit_target_a',
      email: 'dodger_limit_target_a@example.com',
      password: 'strong_password_123',
    });

    await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_limit_target_b',
      email: 'dodger_limit_target_b@example.com',
      password: 'strong_password_123',
    });

    const token = currentUser.body.token as string;

    const response = await request(app)
      .get('/api/v1/users/search?q=dodger_limit&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
      })
    );

    expect(response.body.items.length).toBeLessThanOrEqual(1);
  });
});