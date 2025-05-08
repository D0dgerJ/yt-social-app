import { PrismaClient } from '@prisma/client';
import { createComment } from '../../../application/use-cases/comment/createComment';

const prisma = new PrismaClient();

describe('createComment use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: { email: 'test@example.com', username: 'testuser', password: '123456' },
    });

    post = await prisma.post.create({
      data: {
        userId: user.id,
        desc: 'Test post',
        images: ['img1.jpg'],
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a comment with text', async () => {
    const comment = await createComment({
      userId: user.id,
      postId: post.id,
      content: 'Test comment',
    });

    expect(comment).toHaveProperty('id');
    expect(comment.content).toBe('Test comment');
    expect(comment.files).toEqual([]);
    expect(comment.images).toEqual([]);
    expect(comment.videos).toEqual([]);
  });

  it('creates a comment with files, images, and videos', async () => {
    const comment = await createComment({
      userId: user.id,
      postId: post.id,
      content: 'Multimedia comment',
      files: ['file.pdf'],
      images: ['img.jpg'],
      videos: ['vid.mp4'],
    });

    expect(comment.files).toContain('file.pdf');
    expect(comment.images).toContain('img.jpg');
    expect(comment.videos).toContain('vid.mp4');
  });

  it('throws if userId or postId is missing', async () => {
    await expect(
      createComment({
        // @ts-expect-error: intentionally broken input
        userId: undefined,
        postId: post.id,
        content: 'Oops',
      })
    ).rejects.toThrow();

    await expect(
      createComment({
        userId: user.id,
        // @ts-expect-error
        postId: undefined,
        content: 'Oops',
      })
    ).rejects.toThrow();
  });
});
