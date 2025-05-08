import { PrismaClient } from '@prisma/client';
import { createPost } from '../../../application/use-cases/post/createPost';
import { savePost } from '../../../application/use-cases/post/savePost';
import { unsavePost } from '../../../application/use-cases/post/unsavePost';

const prisma = new PrismaClient();

describe('unsavePost use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.savedPost.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'unsave@example.com',
        username: 'unsaver',
        password: 'pass',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post to save and unsave',
    });

    await savePost({ userId: user.id, postId: post.id });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should unsave a post successfully', async () => {
    await unsavePost({ userId: user.id, postId: post.id });

    const saved = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: post.id,
        },
      },
    });

    expect(saved).toBeNull();
  });

  it('should throw if post was not saved', async () => {
    await prisma.savedPost.deleteMany();

    await expect(
      unsavePost({ userId: user.id, postId: post.id })
    ).rejects.toThrow();
  });
});
