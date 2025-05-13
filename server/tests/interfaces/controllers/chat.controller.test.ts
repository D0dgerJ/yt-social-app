import * as chatController from '../../../interfaces/controllers/chat.controller';
import { createChat } from '../../../application/use-cases/chat/createChat';
import { sendMessage } from '../../../application/use-cases/chat/sendMessage';
import { getUserConversations } from '../../../application/use-cases/chat/getUserConversations';
import { updateMessage } from '../../../application/use-cases/chat/updateMessage';
import { deleteMessage } from '../../../application/use-cases/chat/deleteMessage';
import { deleteConversationIfEmpty } from '../../../application/use-cases/chat/deleteConversationIfEmpty';
import { leaveConversation } from '../../../application/use-cases/chat/leaveConversation';
import { addParticipant } from '../../../application/use-cases/chat/addParticipant';
import prisma from '../../../infrastructure/database/prismaClient.ts';
import { Request, Response } from 'express';

jest.mock('../../../application/use-cases/chat/createChat');
jest.mock('../../../application/use-cases/chat/sendMessage');
jest.mock('../../../application/use-cases/chat/getUserConversations');
jest.mock('../../../application/use-cases/chat/updateMessage');
jest.mock('../../../application/use-cases/chat/deleteMessage');
jest.mock('../../../application/use-cases/chat/deleteConversationIfEmpty');
jest.mock('../../../application/use-cases/chat/leaveConversation');
jest.mock('../../../application/use-cases/chat/addParticipant');
jest.mock('../../../infrastructure/database/prismaClient.ts', () => ({
  message: {
    findMany: jest.fn(),
  },
}));

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  send: jest.fn(),
} as unknown as Response;

describe('Chat Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a chat', async () => {
    const mockReq = { body: { userIds: [1, 2], name: 'Group' } } as Request;
    (createChat as jest.Mock).mockResolvedValue({ id: 1, name: 'Group' });

    await chatController.create(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 1, name: 'Group' });
  });

  it('should send a message', async () => {
    const mockReq = {
      user: { id: 1 },
      body: { conversationId: 2, content: 'Hello' },
    } as unknown as Request;
    (sendMessage as jest.Mock).mockResolvedValue({ id: 10, content: 'Hello' });

    await chatController.send(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 10, content: 'Hello' });
  });

  it('should get user conversations', async () => {
    const mockReq = { user: { id: 1 } } as unknown as Request;
    (getUserConversations as jest.Mock).mockResolvedValue([{ id: 1 }]);

    await chatController.getConversations(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should update a message', async () => {
    const mockReq = { body: { messageId: 1, content: 'Updated' } } as Request;
    (updateMessage as jest.Mock).mockResolvedValue({ id: 1, content: 'Updated' });

    await chatController.update(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 1, content: 'Updated' });
  });

  it('should delete a message and maybe the conversation', async () => {
    const mockReq = { body: { messageId: 1, conversationId: 2 } } as Request;

    await chatController.remove(mockReq, mockRes);

    expect(deleteMessage).toHaveBeenCalledWith(1);
    expect(deleteConversationIfEmpty).toHaveBeenCalledWith(2);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should leave conversation and check deletion', async () => {
    const mockReq = { user: { id: 5 }, body: { conversationId: 2 } } as unknown as Request;

    await chatController.leave(mockReq, mockRes);

    expect(leaveConversation).toHaveBeenCalledWith({ conversationId: 2, userId: 5 });
    expect(deleteConversationIfEmpty).toHaveBeenCalledWith(2);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Left the conversation' });
  });

  it('should add participant to chat', async () => {
    const mockReq = { body: { conversationId: 2, userId: 3 } } as Request;
    (addParticipant as jest.Mock).mockResolvedValue({ id: 10 });

    await chatController.add(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 10 });
  });

  it('should get messages from a conversation', async () => {
    const mockReq = { params: { conversationId: '3' } } as unknown as Request;
    (prisma.message.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

    await chatController.getConversationMessages(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });
});
