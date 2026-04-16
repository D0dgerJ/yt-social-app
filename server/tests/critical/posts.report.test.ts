import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/posts/:id/report', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should create post report for another user post', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_report_owner',
      email: 'dodger_post_report_owner@example.com',
      password: 'strong_password_123',
    });

    const reporter = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_reporter',
      email: 'dodger_post_reporter@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;
    const reporterToken = reporter.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post to report',
      });

    const postId = postResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'spam',
        message: 'This looks like spam content',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        report: expect.objectContaining({
          id: expect.any(Number),
          postId,
          reporterId: reporter.body.id,
          reason: 'spam',
        }),
      })
    );
  });

  it('should return alreadyReported on duplicate post report', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_dup_owner',
      email: 'dodger_post_dup_owner@example.com',
      password: 'strong_password_123',
    });

    const reporter = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_dup_reporter',
      email: 'dodger_post_dup_reporter@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;
    const reporterToken = reporter.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Duplicate report target post',
      });

    const postId = postResponse.body.id as number;

    await request(app)
      .post(`/api/v1/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'spam',
        message: 'First report',
      });

    const secondResponse = await request(app)
      .post(`/api/v1/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'spam',
        message: 'Second report',
      });

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body).toEqual({
      ok: true,
      alreadyReported: true,
    });
  });

  it('should return 403 when reporting own post', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_self_report_owner',
      email: 'dodger_post_self_report_owner@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'My own post',
      });

    const postId = postResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/posts/${postId}/report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        reason: 'spam',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'You cannot report your own post',
        code: 'FORBIDDEN',
      })
    );
  });

  it('should return 400 for invalid reason', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_reason_owner',
      email: 'dodger_post_reason_owner@example.com',
      password: 'strong_password_123',
    });

    const reporter = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_post_reason_reporter',
      email: 'dodger_post_reason_reporter@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;
    const reporterToken = reporter.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post with invalid report reason test',
      });

    const postId = postResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/posts/${postId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'invalid_reason',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid reason',
        code: 'VALIDATION',
      })
    );
  });
});