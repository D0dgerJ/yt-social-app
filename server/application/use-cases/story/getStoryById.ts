import prisma from "../../../infrastructure/database/prismaClient.js";
import { publicUserSelect } from "../../serializers/user.select.js";

export const getStoryById = async (storyId: number) => {
  return prisma.story.findUnique({
    where: { id: storyId },
    include: {
      user: { select: publicUserSelect },
      views: true,
    },
  });
};