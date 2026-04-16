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

describe('POST /api/v1/chat/:chatId/messages', () => {
  beforeEach(async () => {
    await cleanupDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should send message in chat for participant', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_message_user_1',
      email: 'dodger_message_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_message_user_2',
      email: 'dodger_message_user_2@example.com',
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

    const response = await request(app)
      .post(`/api/v1/chat/${chatId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Hello from chat test',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        conversationId: chatId,
        senderId,
        encryptedContent: 'Hello from chat test',
        content: 'Hello from chat test',
        sender: expect.objectContaining({
          id: senderId,
          username: 'dodger_message_user_1',
        }),
      })
    );
  });

  it('should return 400 for empty message payload', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_empty_message_user_1',
      email: 'dodger_empty_message_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_empty_message_user_2',
      email: 'dodger_empty_message_user_2@example.com',
      password: 'strong_password_123',
    });

    const token = firstUser.body.token as string;
    const secondUserId = secondUser.body.id as number;

    const chatResponse = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userIds: [secondUserId],
      });

    expect(chatResponse.status).toBe(201);

    const chatId = chatResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/chat/${chatId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
      })
    );
  });

  it('should return 401 when sending message without token', async () => {
    const response = await request(app)
      .post('/api/v1/chat/1/messages')
      .send({
        content: 'Unauthorized message',
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