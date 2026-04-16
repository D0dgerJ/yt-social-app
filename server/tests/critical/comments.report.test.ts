import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('POST /api/v1/comments/:commentId/report', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should create comment report for another user comment', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_report_owner',
      email: 'dodger_comment_report_owner@example.com',
      password: 'strong_password_123',
    });

    const reporter = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_reporter',
      email: 'dodger_comment_reporter@example.com',
      password: 'strong_password_123',
    });

    expect(owner.status).toBe(201);
    expect(reporter.status).toBe(201);

    const ownerToken = owner.body.token as string;
    const reporterToken = reporter.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post for comment report test',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        postId,
        content: 'Comment to report',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/comments/${commentId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'spam',
        details: 'This comment is spammy',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Report submitted',
        report: expect.objectContaining({
          id: expect.any(Number),
          status: 'PENDING',
        }),
      })
    );
  });

  it('should return 409 on duplicate comment report', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_dup_owner',
      email: 'dodger_comment_dup_owner@example.com',
      password: 'strong_password_123',
    });

    const reporter = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_dup_reporter',
      email: 'dodger_comment_dup_reporter@example.com',
      password: 'strong_password_123',
    });

    expect(owner.status).toBe(201);
    expect(reporter.status).toBe(201);

    const ownerToken = owner.body.token as string;
    const reporterToken = reporter.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post for duplicate comment report',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        postId,
        content: 'Comment for duplicate report test',
      });

    const commentId = commentResponse.body.id as number;

    await request(app)
      .post(`/api/v1/comments/${commentId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'spam',
        details: 'First comment report',
      });

    const secondResponse = await request(app)
      .post(`/api/v1/comments/${commentId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: 'spam',
        details: 'Second comment report',
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body).toEqual(
      expect.objectContaining({
        message: 'You have already reported this comment',
        code: 'CONFLICT',
      })
    );
  });

  it('should return 400 when reporting own comment', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_self_owner',
      email: 'dodger_comment_self_owner@example.com',
      password: 'strong_password_123',
    });

    expect(owner.status).toBe(201);

    const ownerToken = owner.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post for self-comment-report',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        postId,
        content: 'My own comment',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/comments/${commentId}/report`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        reason: 'spam',
        details: 'Trying to report own comment',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'You cannot report your own comment',
        code: 'VALIDATION',
      })
    );
  });

  it('should return 400 for invalid report payload', async () => {
    const suffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

    const owner = await request(app).post('/api/v1/auth/register').send({
      username: `ci_owner_${suffix}`,
      email: `cio_${suffix}@t.dev`,
      password: 'strong_password_123',
    });

    const reporter = await request(app).post('/api/v1/auth/register').send({
      username: `ci_rep_${suffix}`,
      email: `cir_${suffix}@t.dev`,
      password: 'strong_password_123',
    });

    if (owner.status !== 201) {
      console.log('comments.report invalid payload owner.status:', owner.status);
      console.log('comments.report invalid payload owner.body:', owner.body);
    }

    if (reporter.status !== 201) {
      console.log('comments.report invalid payload reporter.status:', reporter.status);
      console.log('comments.report invalid payload reporter.body:', reporter.body);
    }

    expect(owner.status).toBe(201);
    expect(reporter.status).toBe(201);

    const ownerToken = owner.body.token as string;
    const reporterToken = reporter.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post for invalid comment report payload',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        postId,
        content: 'Comment for invalid payload report',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/comments/${commentId}/report`)
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        reason: '',
        details: 'Invalid because reason is empty',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      })
    );
  });
});