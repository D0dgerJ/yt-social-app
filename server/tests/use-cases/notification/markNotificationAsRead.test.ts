import { PrismaClient } from '@prisma/client';
import { createNotification } from '../../../application/use-cases/notification/createNotification';
import { markNotificationAsRead } from '../../../application/use-cases/notification/markNotificationAsRead';

const prisma = new PrismaClient();

describe('markNotificationAsRead use-case', () => {
  let fromUser: any;
  let toUser: any;
  let notification: any;

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();

    fromUser = await prisma.user.create({
      data: { email: 'from@example.com', username: 'fromUser', password: 'pass' },
    });

    toUser = await prisma.user.create({
      data: { email: 'to@example.com', username: 'toUser', password: 'pass' },
    });

    notification = await createNotification({
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      type: 'comment',
      content: 'Commented your post',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should mark a notification as read', async () => {
    const updated = await markNotificationAsRead(notification.id);

    expect(updated.id).toBe(notification.id);
    expect(updated.isRead).toBe(true);
  });

  it('should throw an error if notification does not exist', async () => {
    await prisma.notification.delete({ where: { id: notification.id } });

    await expect(markNotificationAsRead(notification.id)).rejects.toThrow();
  });
});
