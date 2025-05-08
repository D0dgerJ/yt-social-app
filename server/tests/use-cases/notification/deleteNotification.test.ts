import { PrismaClient } from '@prisma/client';
import { deleteNotification } from '../../../application/use-cases/notification/deleteNotification';
import { createNotification } from '../../../application/use-cases/notification/createNotification';

const prisma = new PrismaClient();

describe('deleteNotification use-case', () => {
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
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a notification by ID', async () => {
    await deleteNotification(notification.id);

    const result = await prisma.notification.findUnique({
      where: { id: notification.id },
    });

    expect(result).toBeNull();
  });

  it('should throw an error if notification does not exist', async () => {
    await prisma.notification.delete({ where: { id: notification.id } });

    await expect(deleteNotification(notification.id)).rejects.toThrow();
  });
});
