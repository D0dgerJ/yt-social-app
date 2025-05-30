import { PrismaClient } from '@prisma/client';
import { deleteMessage } from '../../../application/use-cases/chat/deleteMessage';
import { createChat } from '../../../application/use-cases/chat/createChat';
import { sendMessage } from '../../../application/use-cases/chat/sendMessage';

const prisma = new PrismaClient();

describe('deleteMessage use-case', () => {
  let user: any;
  let user2: any;
  let conversation: any;
  let message: any;

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: 'password',
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
      userIds: [user.id, user2.id],
    });

    message = await sendMessage({
      conversationId: conversation.id,
      senderId: user.id,
      content: 'Hello there!',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a message by ID', async () => {
    await deleteMessage(message.id);

    const deleted = await prisma.message.findUnique({
      where: { id: message.id },
    });

    expect(deleted).toBeNull();
  });

  it('should throw if message does not exist', async () => {
    await expect(deleteMessage(999999)).rejects.toThrow();
  });
});
