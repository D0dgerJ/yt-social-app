import prisma from "../../../infrastructure/database/prismaClient.js";
import { publicUserSelect } from "../../serializers/user.select.js";

export const getUserFriends = async (userId: number) => {
  const accepted = await prisma.friendRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
      status: "accepted",
    },
    include: {
      sender: { select: publicUserSelect },
      receiver: { select: publicUserSelect },
    },
  });

  return accepted.map((req) => {
    return req.senderId === userId ? req.receiver : req.sender;
  });
};