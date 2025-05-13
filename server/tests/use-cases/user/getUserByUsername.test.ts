import { getUserByUsername } from '../../../application/use-cases/user/getUserByUsername';
import prisma from "../../../infrastructure/database/prismaClient.ts";

jest.mock("../../../infrastructure/database/prismaClient.ts");

describe('getUserByUsername (use-case)', () => {
  it('должен вернуть данные пользователя по валидному username', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'testuser@example.com',
      profilePicture: 'profile-pic-url',
      coverPicture: 'cover-pic-url',
      desc: 'A test user',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const result = await getUserByUsername('testuser');

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

    expect(result).toEqual(mockUser);
  });

  it('должен выбросить ошибку, если пользователь не найден', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getUserByUsername('nonexistentuser')).rejects.toThrow('User not found');
  });

  it('должен выбросить ошибку при внутренней ошибке', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Some error'));

    await expect(getUserByUsername('testuser')).rejects.toThrow('Some error');
  });
});
