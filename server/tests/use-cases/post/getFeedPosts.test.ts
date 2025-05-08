import { PrismaClient } from '@prisma/client';
import { getFeedPosts } from '../../../application/use-cases/post/getFeedPosts';
import { createPost } from '../../../application/use-cases/post/createPost';
import { followUser } from '../../../application/use-cases/notification/followUser';

const prisma = new PrismaClient();

describe('getFeedPosts use-case', () => {
  let mainUser: any;
  let followedUser: any;

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    mainUser = await prisma.user.create({
      data: { email: 'main@example.com', username: 'main', password: '123456' },
    });

    followedUser = await prisma.user.create({
      data: { email: 'followed@example.com', username: 'followed', password: '123456' },
    });

    await followUser({ followerId: mainUser.id, followingId: followedUser.id });

    await createPost({ userId: mainUser.id, desc: 'Main user post' });
    await new Promise(res => setTimeout(res, 100)); // для порядка сортировки
    await createPost({ userId: followedUser.id, desc: 'Followed user post' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return feed posts including own and followed users posts', async () => {
    const posts = await getFeedPosts(mainUser.id);

    expect(posts.length).toBe(2);
    expect(posts[0].createdAt > posts[1].createdAt).toBe(true);

    for (const post of posts) {
      expect(post).toHaveProperty('user');
      expect(post).toHaveProperty('comments');
      expect(post).toHaveProperty('likes');
      expect(post).toHaveProperty('savedBy');
      expect([mainUser.id, followedUser.id]).toContain(post.userId);
    }
  });

  it('should return only own posts if user follows no one', async () => {
    const soloUser = await prisma.user.create({
      data: { email: 'solo@example.com', username: 'solo', password: 'pass' },
    });

    await createPost({ userId: soloUser.id, desc: 'Solo post' });

    const posts = await getFeedPosts(soloUser.id);

    expect(posts.length).toBe(1);
    expect(posts[0].userId).toBe(soloUser.id);
  });
});
