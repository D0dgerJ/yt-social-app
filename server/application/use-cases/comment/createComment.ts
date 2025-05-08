import prisma from '../../../infrastructure/database/prismaClient';

interface CreateCommentInput {
  userId: number;
  postId: number;
  content: string;
  files?: string[];
  images?: string[];
  videos?: string[];
}

export const createComment = async ({
  userId,
  postId,
  content,
  files = [],
  images = [],
  videos = [],
}: CreateCommentInput) => {
  return prisma.comment.create({
    data: {
      userId,
      postId,
      content,
      files,
      images,
      videos,
    },
  });
};
