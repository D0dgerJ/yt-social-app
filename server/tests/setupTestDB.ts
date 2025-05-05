import { PrismaClient } from '@prisma/client';
import { afterEach, afterAll } from '@jest/globals';

const prisma = new PrismaClient();

afterEach(async () => {
  await prisma.$transaction([
    prisma.storyView.deleteMany(),
    prisma.story.deleteMany(),
    prisma.savedPost.deleteMany(),
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.participant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
