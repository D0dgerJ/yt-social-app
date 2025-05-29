import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GetIncomingFriendRequestsParams {
  userId: number;
}

export const getIncomingFriendRequests = async ({ userId }: GetIncomingFriendRequestsParams) => {
  const requests = await prisma.friendRequest.findMany({
    where: {
      receiverId: userId,
      status: "pending",
    },
    include: {
      sender: {
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
