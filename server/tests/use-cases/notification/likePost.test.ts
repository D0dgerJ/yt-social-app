import { PrismaClient } from '@prisma/client';
import { likePost } from '../../../application/use-cases/notification/likePost';
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
        email: 'liker@example.com',
        username: 'liker',
        password: 'pass123',
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

  it('should create a like record for a post', async () => {
    const like = await likePost({
      userId: user.id,
      postId: post.id,
    });

    expect(like).toHaveProperty('id');
    expect(like.userId).toBe(user.id);
    expect(like.postId).toBe(post.id);
  });

  it('should throw an error if post is already liked', async () => {
    await likePost({ userId: user.id, postId: post.id });

    await expect(
      likePost({ userId: user.id, postId: post.id })
    ).rejects.toThrow();
  });

  it('should throw if userId or postId is invalid', async () => {
    // @ts-expect-error: invalid user
    await expect(likePost({ userId: undefined, postId: post.id })).rejects.toThrow();

    // @ts-expect-error: invalid post
    await expect(likePost({ userId: user.id, postId: undefined })).rejects.toThrow();
  });
});
