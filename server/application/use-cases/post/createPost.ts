import prisma from '../../../infrastructure/database/prismaClient';

interface CreatePostInput {
  userId: number;
  desc?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export const createPost = async ({ userId, desc, mediaUrl, mediaType = 'image' }: CreatePostInput) => {
  return prisma.post.create({
    data: {
      userId,
      desc,
      mediaUrl,
      mediaType,
    },
  });
};
