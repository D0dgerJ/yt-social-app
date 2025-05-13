import prisma from '../../../infrastructure/database/prismaClient.ts';

interface CreatePostInput {
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const createPost = async ({
  userId,
  desc,
  images = [],
  videos = [],
  files = [],
}: CreatePostInput) => {
  return prisma.post.create({
    data: {
      userId,
      desc,
      images,
      videos,
      files,
    },
  });
};
