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

describe('GET /api/v1/chat/:chatId/messages', () => {
  beforeEach(async () => {
    await cleanupDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return conversation messages for participant', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_get_messages_user_1',
      email: 'dodger_get_messages_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_get_messages_user_2',
      email: 'dodger_get_messages_user_2@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;
    const senderId = firstUser.body.id as number;
    const secondUserId = secondUser.body.id as number;

    const chatResponse = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userIds: [secondUserId],
      });

    expect(chatResponse.status).toBe(201);

    const chatId = chatResponse.body.id as number;

    const sendResponse = await request(app)
      .post(`/api/v1/chat/${chatId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'First chat message',
      });

    expect(sendResponse.status).toBe(201);

    const response = await request(app)
      .get(`/api/v1/chat/${chatId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        messages: expect.any(Array),
        pageInfo: expect.objectContaining({
          hasMore: expect.any(Boolean),
          nextCursor: expect.anything(),
          direction: expect.any(String),
        }),
      })
    );

    expect(response.body.messages.length).toBeGreaterThan(0);
    expect(response.body.messages[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        conversationId: chatId,
        senderId,
        encryptedContent: 'First chat message',
        sender: expect.objectContaining({
          id: senderId,
          username: 'dodger_get_messages_user_1',
        }),
      })
    );
  });

  it('should return 401 when getting messages without token', async () => {
    const response = await request(app).get('/api/v1/chat/1/messages');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      })
    );
  });
});