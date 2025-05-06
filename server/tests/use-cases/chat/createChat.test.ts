import { createChat } from '../../../application/use-cases/chat/createChat';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('createChat use-case', () => {
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
        password: 'password1',
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password2',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a one-on-one chat between two users', async () => {
    const conversation = await createChat({ userIds: [user1.id, user2.id] });

    expect(conversation).toHaveProperty('id');
    expect(conversation.isGroup).toBe(false);
    expect(conversation.participants.length).toBe(2);
  });

  it('should create a group chat with a name and multiple users', async () => {
    const user3 = await prisma.user.create({
      data: {
        email: 'user3@example.com',
        username: 'user3',
        password: 'password3',
      },
    });

    const conversation = await createChat({
      userIds: [user1.id, user2.id, user3.id],
      name: 'Project Group',
    });

    expect(conversation.isGroup).toBe(true);
    expect(conversation.name).toBe('Project Group');
    expect(conversation.participants.length).toBe(3);
  });

  it('should throw error if fewer than two users provided', async () => {
    await expect(createChat({ userIds: [user1.id] })).rejects.toThrow(
      'At least two users are required to start a chat'
    );
  });
});
