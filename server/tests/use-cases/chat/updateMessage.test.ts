import { PrismaClient } from '@prisma/client';
import { createChat } from '../../../application/use-cases/chat/createChat';
import { sendMessage } from '../../../application/use-cases/chat/sendMessage';
import { updateMessage } from '../../../application/use-cases/chat/updateMessage';

const prisma = new PrismaClient();

describe('updateMessage use-case', () => {
  let user1: any;
  let user2: any;
  let conversation: any;
  let message: any;

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

    message = await sendMessage({
      conversationId: conversation.id,
      senderId: user1.id,
      content: 'Original message',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should update the content of a message', async () => {
    const updated = await updateMessage({
      messageId: message.id,
      content: 'Updated message content',
    });

    expect(updated.id).toBe(message.id);
    expect(updated.content).toBe('Updated message content');
  });

  it('should throw if message does not exist', async () => {
    await expect(updateMessage({
      messageId: 999999,
      content: 'Text',
    })).rejects.toThrow();
  });
});
