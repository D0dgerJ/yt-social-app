import { PrismaClient } from '@prisma/client';
import { getAllPosts } from '../../../application/use-cases/post/getAllPosts';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('getAllPosts use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'viewer@example.com',
        username: 'viewer',
        password: 'pass',
      },
    });

    await createPost({
      userId: user.id,
      desc: 'First post',
    });

    await new Promise(res => setTimeout(res, 100)); // небольшая задержка

    await createPost({
      userId: user.id,
      desc: 'Second post',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all posts ordered by createdAt descending', async () => {
    const posts = await getAllPosts();

    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBe(2);
    expect(posts[0].createdAt > posts[1].createdAt).toBe(true);

    for (const post of posts) {
      expect(post).toHaveProperty('user');
      expect(post).toHaveProperty('comments');
      expect(post).toHaveProperty('likes');
      expect(post).toHaveProperty('savedBy');
    }
  });
});
