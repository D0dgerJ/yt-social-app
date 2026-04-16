import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../interfaces/app.js';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

describe('DELETE /api/v1/comments/:commentId', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should delete root comment for owner', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_delete_user',
      email: 'dodger_comment_delete_user@example.com',
      password: 'strong_password_123',
    });

    const token = registerResponse.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desc: 'Post for comment delete test',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        content: 'Comment to delete',
      });

    const commentId = commentResponse.body.id as number;

    const deleteResponse = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app).get(`/api/v1/comments/${commentId}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(
      expect.objectContaining({
        id: commentId,
        content: '(deleted)',
      })
    );
  });

  it('should return 403 when non-owner tries to delete comment', async () => {
    const owner = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_delete_owner',
      email: 'dodger_comment_delete_owner@example.com',
      password: 'strong_password_123',
    });

    const stranger = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_comment_delete_stranger',
      email: 'dodger_comment_delete_stranger@example.com',
      password: 'strong_password_123',
    });

    const ownerToken = owner.body.token as string;
    const strangerToken = stranger.body.token as string;

    const postResponse = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        desc: 'Post for forbidden comment delete test',
      });

    const postId = postResponse.body.id as number;

    const commentResponse = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        postId,
        content: 'Owner comment for delete protection',
      });

    const commentId = commentResponse.body.id as number;

    const response = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden: Not the owner.',
    });
  });

  it('should return 401 when deleting comment without token', async () => {
    const response = await request(app).delete('/api/v1/comments/1');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});