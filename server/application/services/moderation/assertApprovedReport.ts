import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";

export const assertApprovedCommentReport = async (commentId: number) => {
  const approved = await prisma.commentReport.findFirst({
    where: {
      commentId,
      status: "APPROVED",
    },
    select: { id: true },
  });

  if (!approved) {
    throw Errors.validation(
      "At least one report must be approved before moderation action"
    );
  }
};
