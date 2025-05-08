import { PrismaClient } from '@prisma/client';
import { likePost } from '../../../application/use-cases/post/likePost';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('likePost use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'likeuser@example.com',
        username: 'likeuser',
        password: '123456',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post to like',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should like a post successfully', async () => {
    const result = await likePost({ userId: user.id, postId: post.id });

    expect(result).toHaveProperty('id');
    expect(result.userId).toBe(user.id);
    expect(result.postId).toBe(post.id);
  });

  it('should throw if like already exists', async () => {
    await likePost({ userId: user.id, postId: post.id });

    await expect(
      likePost({ userId: user.id, postId: post.id })
    ).rejects.toThrow();
  });

  it('should throw if user or post does not exist', async () => {
    await expect(
      likePost({ userId: 999999, postId: post.id })
    ).rejects.toThrow();

    await expect(
      likePost({ userId: user.id, postId: 999999 })
    ).rejects.toThrow();
  });
});
