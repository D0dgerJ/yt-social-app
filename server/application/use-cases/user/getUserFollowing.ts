import prisma from "../../../infrastructure/database/prismaClient.js";
import { publicUserSelect } from "../../serializers/user.select.js";

export const getUserFollowing = async (userId: number) => {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: publicUserSelect,
      },
    },
  });
};