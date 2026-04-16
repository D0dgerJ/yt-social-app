import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import { cleanupDatabase, disconnectDatabase } from '../helpers/db.js';

const mockIo = {
  to: jest.fn(() => ({
    emit: jest.fn(),
    except: jest.fn(() => ({
      emit: jest.fn(),
    })),
  })),
  emit: jest.fn(),
};

jest.unstable_mockModule('../../infrastructure/websocket/socket.js', () => ({
  getIO: () => mockIo,
}));

const { default: app } = await import('../../interfaces/app.js');

describe('GET /api/v1/notifications', () => {
  beforeEach(async () => {
    await cleanupDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return notifications for authenticated user', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_notification_sender',
      email: 'dodger_notification_sender@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_notification_receiver',
      email: 'dodger_notification_receiver@example.com',
      password: 'strong_password_123',
    });

    const senderToken = firstUser.body.token as string;
    const receiverToken = secondUser.body.token as string;
    const receiverId = secondUser.body.id as number;

    // Триггерим уведомление через follow
    const followResponse = await request(app)
      .put(`/api/v1/users/${receiverId}/follow`)
      .set('Authorization', `Bearer ${senderToken}`);

    expect(followResponse.status).toBe(200);

    const response = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${receiverToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        toUserId: receiverId,
        fromUserId: firstUser.body.id,
        type: expect.any(String),
        isRead: expect.any(Boolean),
        fromUser: expect.objectContaining({
          id: firstUser.body.id,
          username: 'dodger_notification_sender',
        }),
      })
    );
  });

  it('should return empty array when user has no notifications', async () => {
    const user = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_notification_empty_user',
      email: 'dodger_notification_empty_user@example.com',
      password: 'strong_password_123',
    });

    const token = user.body.token as string;

    const response = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 401 when getting notifications without token', async () => {
    const response = await request(app).get('/api/v1/notifications');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});