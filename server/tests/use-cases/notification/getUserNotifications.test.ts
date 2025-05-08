import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../../application/use-cases/notification/createNotification';
import { getUserNotifications } from '../../../application/use-cases/notification/getUserNotifications';

const prisma = new PrismaClient();

describe('getUserNotifications use-case', () => {
  let sender: any;
  let receiver: any;

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();

    sender = await prisma.user.create({
      data: { email: 'sender@example.com', username: 'sender', password: 'pass' },
    });

    receiver = await prisma.user.create({
      data: { email: 'receiver@example.com', username: 'receiver', password: 'pass' },
    });

    await createNotification({
      fromUserId: sender.id,
      toUserId: receiver.id,
      type: 'like',
      content: 'User liked your post',
    });

    await createNotification({
      fromUserId: sender.id,
      toUserId: receiver.id,
      type: 'comment',
      content: 'User commented on your post',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all notifications for a user, sorted by createdAt descending', async () => {
    const notifications = await getUserNotifications(receiver.id);

    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBe(2);
    expect(notifications[0].createdAt >= notifications[1].createdAt).toBe(true);
    expect(notifications[0]).toHaveProperty('fromUser');
    expect(notifications[0]).toHaveProperty('type');
  });

  it('should return an empty array if user has no notifications', async () => {
    const otherUser = await prisma.user.create({
      data: { email: 'nobody@example.com', username: 'nobody', password: '123' },
    });

    const notifications = await getUserNotifications(otherUser.id);
    expect(notifications).toEqual([]);
  });

  it('should throw an error if userId is invalid', async () => {
    await expect(getUserNotifications(0)).rejects.toThrow();
  });
});
