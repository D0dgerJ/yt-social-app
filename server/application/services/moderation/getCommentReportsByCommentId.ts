import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";

export const getCommentReportsByCommentId = async (commentId: number) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      postId: true,
      userId: true,
      content: true,
      images: true,
      videos: true,
      files: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, username: true, profilePicture: true } },
      hiddenAt: true,
      hiddenReason: true,
      hiddenBy: { select: { id: true, username: true } },
      deletedAt: true,
      deletedReason: true,
      deletedBy: { select: { id: true, username: true } },
    },
  });

  if (!comment) throw Errors.notFound("Comment not found");

  const reports = await prisma.commentReport.findMany({
    where: { commentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      reviewedAt: true,
      reporter: { select: { id: true, username: true, profilePicture: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
  });

  return { comment, reports };
};
