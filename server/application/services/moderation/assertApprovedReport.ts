import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

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
