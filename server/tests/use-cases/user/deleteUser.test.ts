import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { deleteUser } from '../../../application/use-cases/user/deleteUser';

const prisma = new PrismaClient();

describe('deleteUser use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    user = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a user by ID', async () => {
    await deleteUser(user.id);

    const deleted = await prisma.user.findUnique({ where: { id: user.id } });
    expect(deleted).toBeNull();
  });

  it('should throw an error if user does not exist', async () => {
    await deleteUser(user.id); // Удаляем сначала

    await expect(deleteUser(user.id)).rejects.toThrow();
  });
});
