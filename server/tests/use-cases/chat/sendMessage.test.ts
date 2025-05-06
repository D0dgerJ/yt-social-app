import { PrismaClient } from '@prisma/client';
import { sendMessage } from '../../../application/use-cases/chat/sendMessage';
import { createChat } from '../../../application/use-cases/chat/createChat';

const prisma = new PrismaClient();

describe('sendMessage use-case', () => {
  let user1: any;
  let user2: any;
  let conversation: any;

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();

    user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'user1',
        password: 'pass',
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'pass',
      },
    });

    conversation = await createChat({ userIds: [user1.id, user2.id] });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should send a message successfully', async () => {
    const message = await sendMessage({
      conversationId: conversation.id,
      senderId: user1.id,
      content: 'Hello!',
    });

    expect(message).toHaveProperty('id');
    expect(message.content).toBe('Hello!');
    expect(message.conversationId).toBe(conversation.id);
    expect(message.senderId).toBe(user1.id);
  });

  it('should throw if conversation does not exist', async () => {
    await expect(sendMessage({
      conversationId: 999999,
      senderId: user1.id,
      content: 'Test',
    })).rejects.toThrow();
  });

  it('should throw if sender does not exist', async () => {
    await expect(sendMessage({
      conversationId: conversation.id,
      senderId: 999999,
      content: 'Test',
    })).rejects.toThrow();
  });
});
