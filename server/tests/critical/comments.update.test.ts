import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('PUT /api/v1/comments/:commentId', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should update root comment for owner', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_update_user',
      email: 'dodger_comment_update_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comment update test',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Original comment text',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Updated comment text',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: commentId,
        content: 'Updated comment text',
      })
    );
  });

  it('should return 403 when non-owner tries to update comment', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_owner',
      email: 'dodger_comment_owner@example.com',
      password: 'strong_password_123',
    });

    const stranger = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_stranger',
      email: 'dodger_comment_stranger@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;
    const strangerToken = stranger.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post for comment ownership test',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        postId,
        content: 'Owner comment',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({
        content: 'Intruder update',
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: Not the owner.',
    });
  });

  it('should return 400 when updated content is empty', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_empty_update',
      email: 'dodger_comment_empty_update@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for empty comment update',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Comment before empty update',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: '   ',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Content cannot be empty',
        code: 'VALIDATION',
      })
    );
  });

  it('should return 401 when updating comment without token', async () => {
    const response = await request(app).put('/api/v1/comments/1').send({
      content: 'Unauthorized comment update',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});