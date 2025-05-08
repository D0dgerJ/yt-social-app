import { PrismaClient } from '@prisma/client';
import { updateComment } from '../../../application/use-cases/comment/updateComment';
import { createComment } from '../../../application/use-cases/comment/createComment';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('updateComment use-case', () => {
  let user: any;
  let post: any;
  let comment: any;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'pass',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post for comment',
    });

    comment = await createComment({
      userId: user.id,
      postId: post.id,
      content: 'Original content',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should update comment content', async () => {
    const updated = await updateComment({
      commentId: comment.id,
      content: 'Updated text',
    });

    expect(updated.content).toBe('Updated text');
  });

  it('should update images, videos, and files', async () => {
    const updated = await updateComment({
      commentId: comment.id,
      images: ['new-img.jpg'],
      videos: ['video.mp4'],
      files: ['file.zip'],
    });

    expect(updated.images).toContain('new-img.jpg');
    expect(updated.videos).toContain('video.mp4');
    expect(updated.files).toContain('file.zip');
  });

  it('should throw if comment does not exist', async () => {
    await prisma.comment.deleteMany();

    await expect(updateComment({ commentId: 999, content: 'fail' })).rejects.toThrow();
  });
});
