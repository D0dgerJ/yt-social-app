import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../../application/use-cases/notification/createNotification';

const prisma = new PrismaClient();

describe('createNotification use-case', () => {
  let fromUser: any;
  let toUser: any;

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();

    fromUser = await prisma.user.create({
      data: { email: 'from@example.com', username: 'fromUser', password: 'pass' },
    });

    toUser = await prisma.user.create({
      data: { email: 'to@example.com', username: 'toUser', password: 'pass' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a notification', async () => {
    const notification = await createNotification({
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      type: 'comment',
      content: 'New comment on your post',
    });

    expect(notification).toHaveProperty('id');
    expect(notification.type).toBe('comment');
    expect(notification.content).toBe('New comment on your post');
    expect(notification.fromUserId).toBe(fromUser.id);
    expect(notification.toUserId).toBe(toUser.id);
    expect(notification.isRead).toBe(false);
  });

  it('should throw an error if required fields are missing', async () => {
    await expect(
      // @ts-expect-error: missing required field
      createNotification({ fromUserId: fromUser.id })
    ).rejects.toThrow();
  });
});
