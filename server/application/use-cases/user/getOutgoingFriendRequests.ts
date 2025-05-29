import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GetOutgoingFriendRequestsParams {
  userId: number;
}

export const getOutgoingFriendRequests = async ({ userId }: GetOutgoingFriendRequestsParams) => {
  const requests = await prisma.friendRequest.findMany({
    where: {
      senderId: userId,
      status: "pending",
    },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  return requests;
};
