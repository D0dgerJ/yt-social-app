import prisma from '../../../infrastructure/database/prismaClient.ts';

interface CreatePostInput {
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export const createPost = async ({
  userId,
  desc,
  images = [],
  videos = [],
  files = [],
  tags = [],
  location = "",
}: CreatePostInput) => {
  return prisma.post.create({
    data: {
      userId,
      desc,
      images,
      videos,
      files,
      tags,
      location,
    },
  });
};