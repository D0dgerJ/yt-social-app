import prisma from "../../../infrastructure/database/prismaClient.ts";
import { publicUserSelect } from "../../serializers/user.select.ts";

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