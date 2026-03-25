import prisma from "../../../infrastructure/database/prismaClient.ts";
import { publicUserSelect } from "../../serializers/user.select.ts";

export const getStoryById = async (storyId: number) => {
  return prisma.story.findUnique({
    where: { id: storyId },
    include: {
      user: { select: publicUserSelect },
      views: true,
    },
  });
};