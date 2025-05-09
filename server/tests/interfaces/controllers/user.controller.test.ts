import { Request, Response } from 'express';
import * as userController from '../../../interfaces/controllers/user.controller';
import * as userUseCases from '../../../application/use-cases/user';

jest.mock('../../../application/use-cases/user');

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  end: jest.fn(),
};

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get user by ID', async () => {
    const mockReq = { params: { id: '1' } } as unknown as Request;
    (userUseCases.getUserById as jest.Mock).mockResolvedValueOnce({ id: 1 });

    await userController.getById(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('should delete user', async () => {
    const mockReq = { user: { id: 2 } } as unknown as Request;
    (userUseCases.deleteUser as jest.Mock).mockResolvedValueOnce(undefined);

    await userController.remove(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should update user', async () => {
    const mockReq = {
      user: { id: 3 },
      body: { name: 'Updated' },
    } as unknown as Request;

    (userUseCases.updateUser as jest.Mock).mockResolvedValueOnce({ id: 3, name: 'Updated' });

    await userController.update(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 3, name: 'Updated' });
  });

  it('should update profile picture', async () => {
    const mockReq = {
      user: { id: 4 },
      body: { profilePicture: 'new.png' },
    } as unknown as Request;

    (userUseCases.updateProfilePicture as jest.Mock).mockResolvedValueOnce({ id: 4, profilePicture: 'new.png' });

    await userController.updateAvatar(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 4, profilePicture: 'new.png' });
  });

  it('should follow user', async () => {
    const mockReq = {
      user: { id: 5 },
      params: { id: '6' },
    } as unknown as Request;

    (userUseCases.followUser as jest.Mock).mockResolvedValueOnce(undefined);

    await userController.follow(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Followed successfully' });
  });

  it('should unfollow user', async () => {
    const mockReq = {
      user: { id: 5 },
      params: { id: '6' },
    } as unknown as Request;

    (userUseCases.unfollowUser as jest.Mock).mockResolvedValueOnce(undefined);

    await userController.unfollow(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unfollowed successfully' });
  });

  it('should get user profile', async () => {
    const mockReq = { user: { id: 7 } } as unknown as Request;
    (userUseCases.getUserProfile as jest.Mock).mockResolvedValueOnce({ id: 7, name: 'John' });

    await userController.profile(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ id: 7, name: 'John' });
  });

  it('should get user friends', async () => {
    const mockReq = { params: { id: '8' } } as unknown as Request;
    (userUseCases.getUserFriends as jest.Mock).mockResolvedValueOnce([{ id: 9 }, { id: 10 }]);

    await userController.friends(mockReq, mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([{ id: 9 }, { id: 10 }]);
  });
});
