import { PrismaClient } from '@prisma/client';
import { getUserConversations } from '../../../application/use-cases/chat/getUserConversations';
import { createChat } from '../../../application/use-cases/chat/createChat';
import { sendMessage } from '../../../application/use-cases/chat/sendMessage';

const prisma = new PrismaClient();

describe('getUserConversations use-case', () => {
  let user1: any;
  let user2: any;

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

    const chat = await createChat({
      userIds: [user1.id, user2.id],
    });

    await sendMessage({
      conversationId: chat.id,
      senderId: user1.id,
      content: 'Hello!',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all conversations for the user', async () => {
    const conversations = await getUserConversations(user1.id);

    expect(Array.isArray(conversations)).toBe(true);
    expect(conversations.length).toBeGreaterThan(0);
    expect(conversations[0]).toHaveProperty('participants');
    expect(conversations[0].messages.length).toBeLessThanOrEqual(1);
  });

  it('should return an empty array if user has no conversations', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'loner@example.com',
        username: 'loner',
        password: 'pass',
      },
    });

    const conversations = await getUserConversations(user.id);

    expect(conversations).toEqual([]);
  });
});
