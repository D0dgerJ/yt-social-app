import { Request, Response } from 'express';
import { getUserByUsername } from '../../../application/use-cases/user/getUserByUsername';
import prisma from "../../../infrastructure/database/prismaClient";

jest.mock('../../../infrastructure/database/prismaClient'); 

describe('getUserByUsername', () => {
  it('should return user data for a valid username', async () => {
    // Мокируем успешный запрос, когда пользователь найден
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'testuser@example.com',
      profilePicture: 'profile-pic-url',
      coverPicture: 'cover-pic-url',
      desc: 'A test user',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const req = { params: { username: 'testuser' } } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getUserByUsername(req, res);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'testuser' },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        coverPicture: true,
        desc: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it('should return 404 if user is not found', async () => {
    // Мокируем случай, когда пользователь не найден
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { username: 'nonexistentuser' } } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getUserByUsername(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should return 500 if there is an internal server error', async () => {
    // Мокируем ошибку сервера
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Some error'));

    const req = { params: { username: 'testuser' } } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getUserByUsername(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
