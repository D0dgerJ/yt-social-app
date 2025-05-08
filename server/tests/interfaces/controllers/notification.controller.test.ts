import * as notificationController from '../../../interfaces/controllers/notification.controller';
import * as notificationUseCases from '../../../application/use-cases/notification';
import { Request, Response } from 'express';

jest.mock('../../../application/use-cases/notification/getUserNotifications');
jest.mock('../../../application/use-cases/notification/markNotificationAsRead');
jest.mock('../../../application/use-cases/notification/createNotification');

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user notifications', async () => {
    const mockReq = { user: { id: 1 } } as Request;
    (notificationUseCases.getUserNotifications as jest.Mock).mockResolvedValue([{ id: 1 }]);

    await notificationController.getNotifications(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should mark notification as read', async () => {
    const mockReq = { body: { notificationId: 5 } } as Request;
    (notificationUseCases.markNotificationAsRead as jest.Mock).mockResolvedValue({ id: 5, isRead: true });

    await notificationController.markAsRead(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 5, isRead: true });
  });

  it('should create a notification', async () => {
    const mockReq = {
      user: { id: 1 },
      body: { receiverId: 2, type: 'like', content: 'New like' },
    } as unknown as Request;
    (notificationUseCases.createNotification as jest.Mock).mockResolvedValue({ id: 99 });

    await notificationController.create(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 99 });
  });
});
