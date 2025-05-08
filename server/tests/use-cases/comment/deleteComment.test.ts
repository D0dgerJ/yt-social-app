import { PrismaClient } from '@prisma/client';
import { deleteComment } from '../../../application/use-cases/comment/deleteComment';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('deleteComment use-case', () => {
  let user: any;
  let post: any;
  let comment: any;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: 'pass',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Test post',
    });

    comment = await prisma.comment.create({
      data: {
        postId: post.id,
        userId: user.id,
        content: 'Test comment',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a comment by ID', async () => {
    await deleteComment(comment.id);

    const deleted = await prisma.comment.findUnique({
      where: { id: comment.id },
    });

    expect(deleted).toBeNull();
  });

  it('should throw an error if comment does not exist', async () => {
    await prisma.comment.delete({ where: { id: comment.id } });

    await expect(deleteComment(comment.id)).rejects.toThrow();
  });
});
