import { PrismaClient } from '@prisma/client';
import { createPost } from '../../../application/use-cases/post/createPost';
import { updatePost } from '../../../application/use-cases/post/updatePost';

const prisma = new PrismaClient();

describe('updatePost use-case', () => {
  let user: any;
  let otherUser: any;
  let post: any;

  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: 'pass',
      },
    });

    otherUser = await prisma.user.create({
      data: {
        email: 'hacker@example.com',
        username: 'hacker',
        password: 'hack',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Initial description',
      images: ['old.jpg'],
      videos: [],
      files: [],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should update post content and media', async () => {
    const updated = await updatePost({
      postId: post.id,
      userId: user.id,
      desc: 'Updated description',
      images: ['new.jpg'],
      videos: ['video.mp4'],
      files: ['doc.pdf'],
    });

    expect(updated.desc).toBe('Updated description');
    expect(updated.images).toEqual(['new.jpg']);
    expect(updated.videos).toEqual(['video.mp4']);
    expect(updated.files).toEqual(['doc.pdf']);
  });

  it('should throw if post does not exist', async () => {
    await expect(
      updatePost({
        postId: 999999,
        userId: user.id,
        desc: 'No such post',
      })
    ).rejects.toThrow('Post not found or user is not the owner');
  });

  it('should throw if user is not the owner', async () => {
    await expect(
      updatePost({
        postId: post.id,
        userId: otherUser.id,
        desc: 'Attempted hack',
      })
    ).rejects.toThrow('Post not found or user is not the owner');
  });
});
