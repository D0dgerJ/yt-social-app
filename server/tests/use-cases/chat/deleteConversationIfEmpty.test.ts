import { PrismaClient } from '@prisma/client';
import { deleteConversationIfEmpty } from '../../../application/use-cases/chat/deleteConversationIfEmpty';

const prisma = new PrismaClient();

describe('deleteConversationIfEmpty use-case', () => {
  let conversation: any;

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();

    conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete conversation if it has no participants', async () => {
    await deleteConversationIfEmpty(conversation.id);

    const found = await prisma.conversation.findUnique({
      where: { id: conversation.id },
    });

    expect(found).toBeNull(); // должен быть удалён
  });

  it('should not delete conversation if it has participants', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: 'pass',
      },
    });

    await prisma.participant.create({
      data: {
        conversationId: conversation.id,
        userId: user.id,
      },
    });

    await deleteConversationIfEmpty(conversation.id);

    const found = await prisma.conversation.findUnique({
      where: { id: conversation.id },
    });

    expect(found).not.toBeNull(); // должен остаться
  });
});
