import { PrismaClient } from '@prisma/client';
import { getPostById } from '../../../application/use-cases/post/getPostById';
import { createPost } from '../../../application/use-cases/post/createPost';

const prisma = new PrismaClient();

describe('getPostById use-case', () => {
  let user: any;
  let post: any;

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'testuser',
        password: 'securepass',
        profilePicture: 'profile.jpg',
      },
    });

    post = await createPost({
      userId: user.id,
      desc: 'Sample post description',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a post by its ID including selected user fields', async () => {
    const result = await getPostById(post.id);

    expect(result).toBeTruthy();
    expect(result?.id).toBe(post.id);
    expect(result?.user).toEqual({
      id: user.id,
      username: user.username,
      profilePicture: user.profilePicture,
    });
  });

  it('should return null for a non-existent post ID', async () => {
    const result = await getPostById(999999);
    expect(result).toBeNull();
  });

  it('should return null for invalid ID (e.g. 0)', async () => {
    const result = await getPostById(0);
    expect(result).toBeNull();
  });
});
