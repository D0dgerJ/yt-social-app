import prisma from '../../../infrastructure/database/prismaClient.ts';

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
  });

  if (!existingPost || existingPost.userId !== userId) {
    throw new Error('Post not found or user is not the owner');
  }

  return prisma.post.update({
    where: { id: postId },
    data: {
      desc,
      images,
      videos,
      files,
      tags,
      location,
    },
  });
};
