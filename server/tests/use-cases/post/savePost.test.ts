import { PrismaClient } from '@prisma/client';
import { savePost } from '../../../application/use-cases/post/savePost';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('savePost use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.savedPost.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'saveuser@example.com',
        username: 'saveuser',
        password: 'pass123',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post to save',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should save a post successfully', async () => {
    const result = await savePost({ userId: user.id, postId: post.id });

    expect(result).toHaveProperty('id');
    expect(result.userId).toBe(user.id);
    expect(result.postId).toBe(post.id);
  });

  it('should throw if post is already saved by user', async () => {
    await savePost({ userId: user.id, postId: post.id });

    await expect(savePost({ userId: user.id, postId: post.id })).rejects.toThrow();
  });

  it('should throw if user or post does not exist', async () => {
    await expect(savePost({ userId: 999999, postId: post.id })).rejects.toThrow();
    await expect(savePost({ userId: user.id, postId: 999999 })).rejects.toThrow();
  });
});
