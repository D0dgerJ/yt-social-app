import { PrismaClient } from '@prisma/client';
import { createPost } from '../../../application/use-cases/post/createPost';
import { createComment } from '../../../application/use-cases/comment/createComment';
import { getPostComments } from '../../../application/use-cases/comment/getPostComments';

const prisma = new PrismaClient();

describe('getPostComments use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'commenter@example.com',
        username: 'commenter',
        password: '123456',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Post for comments',
    });

    await createComment({
      userId: user.id,
      postId: post.id,
      content: 'Comment 1',
    });

    await createComment({
      userId: user.id,
      postId: post.id,
      content: 'Comment 2',
      images: ['img1.jpg'],
      videos: ['vid1.mp4'],
      files: ['file1.pdf'],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all comments for a post', async () => {
    const comments = await getPostComments(post.id);

    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBe(2);
    expect(comments[0]).toHaveProperty('id');
    expect(comments[0]).toHaveProperty('content');
  });

  it('should return an empty array for a post without comments', async () => {
    const newPost = await createPost({
      userId: user.id,
      desc: 'Empty post',
    });

    const comments = await getPostComments(newPost.id);

    expect(comments).toEqual([]);
  });

  it('should throw if postId is invalid', async () => {
    await expect(getPostComments(0)).rejects.toThrow();
  });
});
