import { PrismaClient } from '@prisma/client';
import { createPost } from '../../../application/use-cases/post/createPost';
import { savePost } from '../../../application/use-cases/notification/savePost';

const prisma = new PrismaClient();

describe('savePost use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.savedPost.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: { email: 'user@example.com', username: 'user', password: 'pass' },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post to save',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should save a post for a user', async () => {
    const saved = await savePost({ userId: user.id, postId: post.id });

    expect(saved).toHaveProperty('id');
    expect(saved.userId).toBe(user.id);
    expect(saved.postId).toBe(post.id);
  });

  it('should throw if the post is already saved', async () => {
    await savePost({ userId: user.id, postId: post.id });

    await expect(savePost({ userId: user.id, postId: post.id })).rejects.toThrow();
  });

  it('should throw if userId or postId is missing', async () => {
    // @ts-expect-error: missing userId
    await expect(savePost({ postId: post.id })).rejects.toThrow();

    // @ts-expect-error: missing postId
    await expect(savePost({ userId: user.id })).rejects.toThrow();
  });
});
