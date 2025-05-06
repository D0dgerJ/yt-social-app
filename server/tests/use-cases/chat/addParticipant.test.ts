import { PrismaClient } from '@prisma/client';
import { addParticipant } from '../../../application/use-cases/chat/addParticipant';
import { createChat } from '../../../application/use-cases/chat/createChat';

const prisma = new PrismaClient();

describe('addParticipant use-case', () => {
  let conversation: any;
  let user1: any;
  let user2: any;
  let newUser: any;

  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.user.deleteMany();

    user1 = await prisma.user.create({
      data: { email: 'user1@example.com', username: 'user1', password: 'pass1' },
    });

    user2 = await prisma.user.create({
      data: { email: 'user2@example.com', username: 'user2', password: 'pass2' },
    });

    newUser = await prisma.user.create({
      data: { email: 'new@example.com', username: 'newbie', password: 'pass3' },
    });

    conversation = await createChat({
      userIds: [user1.id, user2.id],
      name: 'Test group',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('adds a new participant to an existing conversation', async () => {
    const result = await addParticipant({
      conversationId: conversation.id,
      userId: newUser.id,
    });

    expect(result).toHaveProperty('conversationId', conversation.id);
    expect(result).toHaveProperty('userId', newUser.id);

    const updatedParticipants = await prisma.participant.findMany({
      where: { conversationId: conversation.id },
    });

    expect(updatedParticipants.length).toBe(3);
  });

  it('throws if user is already a participant', async () => {
    await expect(
      addParticipant({ conversationId: conversation.id, userId: user1.id })
    ).rejects.toThrow();
  });

  it('throws if conversation does not exist', async () => {
    const ghostUser = await prisma.user.create({
      data: { email: 'ghost@example.com', username: 'ghost', password: 'pass' },
    });

    await expect(
      addParticipant({ conversationId: 999999, userId: ghostUser.id })
    ).rejects.toThrow();
  });
});
