import prisma from "../../../infrastructure/database/prismaClient";

interface CreateReplyParams {
  postId: number;
  userId: number;
  parentId: number;
  content: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const createReply = async ({
  postId,
  userId,
  parentId,
  content,
  images = [],
  videos = [],
  files = [],
}: CreateReplyParams) => {
  const postExists = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!postExists) {
    throw new Error("Post does not exist.");
  }

  const parentCommentExists = await prisma.comment.findUnique({
    where: { id: parentId },
    select: { id: true },
  });

  if (!parentCommentExists) {
    throw new Error("Parent comment does not exist.");
  }

  const reply = await prisma.comment.create({
    data: {
      postId,
      userId,
      parentId,
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

  return reply;
};
