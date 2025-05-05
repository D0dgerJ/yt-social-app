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

  it('should create a new chat between two users', async () => {
    const conversation = await createChat(user1.id, user2.id);

    expect(conversation).toHaveProperty('id');
    expect(conversation.participants.length).toBe(2);
  });

  it('should return existing chat if it already exists', async () => {
    const firstChat = await createChat(user1.id, user2.id);
    const secondChat = await createChat(user1.id, user2.id);

    expect(secondChat.id).toBe(firstChat.id);
  });
});
