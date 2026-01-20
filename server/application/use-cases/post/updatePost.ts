import prisma from '../../../infrastructure/database/prismaClient.ts';
import { ContentStatus } from '@prisma/client';

interface UpdatePostInput {
  postId: number;
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export const updatePost = async ({
  postId,
  userId,
  desc,
  images,
  videos,
  files,
  tags,
  location,
}: UpdatePostInput) => {
  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, status: true },
  });

  if (!existingPost) {
    throw new Error('Post not found');
  }

  if (existingPost.userId !== userId) {
    throw new Error('User is not the owner');
  }

  if (existingPost.status === ContentStatus.DELETED) {
    throw new Error('Post is deleted');
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      ...(desc !== undefined && { desc }),
      ...(images !== undefined && { images }),
      ...(videos !== undefined && { videos }),
      ...(files !== undefined && { files }),
      ...(tags !== undefined && { tags }),
      ...(location !== undefined && { location }),
    },
  });
};
