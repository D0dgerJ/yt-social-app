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

describe('Chat permissions', () => {
  beforeEach(async () => {
    await cleanupDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDatabase();
  });

  it('should return 400 when non-participant sends message to chat', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_perm_user_1',
      email: 'dodger_chat_perm_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_perm_user_2',
      email: 'dodger_chat_perm_user_2@example.com',
      password: 'strong_password_123',
    });

    const outsider = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_perm_outsider',
      email: 'dodger_chat_perm_outsider@example.com',
      password: 'strong_password_123',
    });

    expect(firstUser.status).toBe(201);
    expect(secondUser.status).toBe(201);
    expect(outsider.status).toBe(201);

    const creatorToken = firstUser.body.token as string;
    const outsiderToken = outsider.body.token as string;
    const secondUserId = secondUser.body.id as number;

    const chatResponse = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        userIds: [secondUserId],
      });

    expect(chatResponse.status).toBe(201);

    const chatId = chatResponse.body.id as number;

    const response = await request(app)
      .post(`/api/v1/chat/${chatId}/messages`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        content: 'I should not be here',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'You are not a participant of this chat',
      })
    );
  });

  it('should return 500 when non-participant tries to get messages', async () => {
    const firstUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_read_user_1',
      email: 'dodger_chat_read_user_1@example.com',
      password: 'strong_password_123',
    });

    const secondUser = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_read_user_2',
      email: 'dodger_chat_read_user_2@example.com',
      password: 'strong_password_123',
    });

    const outsider = await request(app).post('/api/v1/auth/register').send({
      username: 'dodger_chat_read_outsider',
      email: 'dodger_chat_read_outsider@example.com',
      password: 'strong_password_123',
    });

    expect(firstUser.status).toBe(201);
    expect(secondUser.status).toBe(201);
    expect(outsider.status).toBe(201);

    const creatorToken = firstUser.body.token as string;
    const outsiderToken = outsider.body.token as string;
    const secondUserId = secondUser.body.id as number;

    const chatResponse = await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        userIds: [secondUserId],
      });

    expect(chatResponse.status).toBe(201);

    const chatId = chatResponse.body.id as number;

    const response = await request(app)
      .get(`/api/v1/chat/${chatId}/messages`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Вы не имеете доступа к этому чату',
      })
    );
  });
});