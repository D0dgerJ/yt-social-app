import { PrismaClient } from '@prisma/client';
import { deletePost } from '../../../application/use-cases/post/deletePost';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('deletePost use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'deleter@example.com',
        username: 'deleter',
        password: '123456',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post to be deleted',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a post by ID', async () => {
    await deletePost(post.id);

    const deleted = await prisma.post.findUnique({ where: { id: post.id } });
    expect(deleted).toBeNull();
  });

  it('should throw an error if post does not exist', async () => {
    await deletePost(post.id); // удаляем

    // пробуем удалить снова
    await expect(deletePost(post.id)).rejects.toThrow();
  });
});
