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

describe('POST /api/v1/chat', () => {
  beforeEach(async () => {
    await cleanupDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should create direct chat for authenticated user', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_user_1',
      email: 'dodger_chat_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_user_2',
      email: 'dodger_chat_user_2@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;
    const secondUserId = secondUser.body.id as number;
    const firstUserId = firstUser.body.id as number;

    const response = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userIds: [secondUserId],
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        isGroup: false,
        participants: expect.any(Array),
      })
    );

    const participantUserIds = response.body.participants.map((p: any) => p.user.id);
    expect(participantUserIds).toContain(firstUserId);
    expect(participantUserIds).toContain(secondUserId);
  });

  it('should return 401 when creating chat without token', async () => {
    const response = await request(app).post('/api/v1/chat').send({
      userIds: [123],
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });

  it('should return 400 when chat payload is invalid', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_invalid_user',
      email: 'dodger_chat_invalid_user@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;

    const response = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userIds: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });
});