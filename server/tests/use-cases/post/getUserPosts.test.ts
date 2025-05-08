import { PrismaClient } from '@prisma/client';
import { getUserPosts } from '../../../application/use-cases/post/getUserPosts';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('getUserPosts use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'postuser',
        password: '123456',
      },
    });

    await createPost({ userId: user.id, desc: 'Post 1' });
    await createPost({ userId: user.id, desc: 'Post 2' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all posts for the user', async () => {
    const posts = await getUserPosts(user.id);

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBe(2);
    expect(posts[0]).toHaveProperty('user');
    expect(posts[0]).toHaveProperty('comments');
    expect(posts[0]).toHaveProperty('likes');
    expect(posts[0]).toHaveProperty('savedBy');
  });

  it('should return empty array if user has no posts', async () => {
    const newUser = await prisma.user.create({
      data: {
        email: 'nopost@example.com',
        username: 'nopostuser',
        password: 'pass',
      },
    });

    const posts = await getUserPosts(newUser.id);
    expect(posts).toEqual([]);
  });

  it('should return empty array for invalid userId (e.g. 0)', async () => {
    const posts = await getUserPosts(0);
    expect(posts).toEqual([]);
  });
});
