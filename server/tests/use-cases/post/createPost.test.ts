import { PrismaClient } from '@prisma/client';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('createPost use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'poster@example.com',
        username: 'poster',
        password: 'securepass',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a post with text, images, videos, and files', async () => {
    const post = await createPost({
      userId: user.id,
      desc: 'My first post!',
      images: ['img1.jpg', 'img2.jpg'],
      videos: ['vid1.mp4'],
      files: ['doc.pdf'],
    });

    expect(post).toHaveProperty('id');
    expect(post.desc).toBe('My first post!');
    expect(post.images).toEqual(expect.arrayContaining(['img1.jpg', 'img2.jpg']));
    expect(post.videos).toEqual(['vid1.mp4']);
    expect(post.files).toEqual(['doc.pdf']);
  });

  it('should create a post with empty media fields if not provided', async () => {
    const post = await createPost({
      userId: user.id,
      desc: 'Empty media',
    });

    expect(post.images).toEqual([]);
    expect(post.videos).toEqual([]);
    expect(post.files).toEqual([]);
  });

  it('should throw if userId is missing', async () => {
    // @ts-expect-error
    await expect(createPost({ desc: 'Invalid post' })).rejects.toThrow();
  });
});
