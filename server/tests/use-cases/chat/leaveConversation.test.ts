import { PrismaClient } from '@prisma/client';
import { createChat } from '../../../application/use-cases/chat/createChat';
import { leaveConversation } from '../../../application/use-cases/chat/leaveConversation';

const prisma = new PrismaClient();

describe('leaveConversation use-case', () => {
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

    conversation = await createChat({
      userIds: [user1.id, user2.id],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should remove the user from the conversation', async () => {
    await leaveConversation({ conversationId: conversation.id, userId: user1.id });

    const participants = await prisma.participant.findMany({
      where: { conversationId: conversation.id },
    });

    expect(participants.some(p => p.userId === user1.id)).toBe(false);
    expect(participants.length).toBe(1);
  });

  it('should not throw if user is already removed', async () => {
    // удалить дважды
    await leaveConversation({ conversationId: conversation.id, userId: user1.id });
    await expect(
      leaveConversation({ conversationId: conversation.id, userId: user1.id })
    ).resolves.not.toThrow();
  });
});
