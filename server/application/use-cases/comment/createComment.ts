import prisma from '../../../infrastructure/database/prismaClient.ts';

interface CreateCommentParams {
  postId: number;
  userId: number;
  content: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const createComment = async ({
  postId,
  userId,
  content,
  images = [],
  videos = [],
  files = [],
}: CreateCommentParams) => {
  const postExists = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!postExists) {
    throw new Error("Post does not exist.");
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      content,
      images,
      videos,
      files,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { likes: true },
      },
      likes: {
        select: { userId: true },
      },
    },
  });

  return comment;
};
