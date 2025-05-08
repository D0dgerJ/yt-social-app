import { PrismaClient } from '@prisma/client';
import { toggleLike } from '../../../application/use-cases/post/toggleLike';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('toggleLike use-case', () => {
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
        password: 'pass123',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post for toggling like',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should like the post if not previously liked', async () => {
    const result = await toggleLike({ userId: user.id, postId: post.id });

    expect(result).toEqual({ liked: true });

    const like = await prisma.like.findFirst({ where: { userId: user.id, postId: post.id } });
    expect(like).not.toBeNull();
  });

  it('should unlike the post if already liked', async () => {
    await toggleLike({ userId: user.id, postId: post.id }); // like
    const result = await toggleLike({ userId: user.id, postId: post.id }); // unlike

    expect(result).toEqual({ liked: false });

    const like = await prisma.like.findFirst({ where: { userId: user.id, postId: post.id } });
    expect(like).toBeNull();
  });

  it('should throw if post or user does not exist', async () => {
    await expect(toggleLike({ userId: 999999, postId: post.id })).rejects.toThrow();
    await expect(toggleLike({ userId: user.id, postId: 999999 })).rejects.toThrow();
  });
});
