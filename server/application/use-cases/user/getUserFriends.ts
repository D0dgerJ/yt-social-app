import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getUserFriends = async (userId: number) => {
  const accepted = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
      status: "accepted",
    },
    include: {
      sender: true,
      receiver: true,
    },
  });

  return accepted.map(req => {
    return req.senderId === userId ? req.receiver : req.sender;
  });
};
