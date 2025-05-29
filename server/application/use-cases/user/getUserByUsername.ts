import prisma from "../../../infrastructure/database/prismaClient.ts";

type FriendRequestStatus = "none" | "pending" | "accepted" | "rejected";

export const getUserByUsername = async (
  username: string,
  currentUserId?: number
) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      profilePicture: true,
      coverPicture: true,
      desc: true,
      followedBy: { select: { id: true } },
      following: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const followersCount = user.followedBy.length;
  const followingCount = user.following.length;

  let isFriend = false;
  let friendRequestStatus: FriendRequestStatus = "none";
  let requestDirection: "incoming" | "outgoing" | null = null;

  if (currentUserId && currentUserId !== user.id) {
    const request = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: user.id },
          { senderId: user.id, receiverId: currentUserId },
        ],
      },
    });

    if (request) {
      friendRequestStatus = request.status as FriendRequestStatus;

      if (request.status === "accepted") {
        isFriend = true;
      }

      if (request.status === "pending") {
        requestDirection = request.senderId === currentUserId ? "outgoing" : "incoming";
      }
    }
  }

  return {
    ...user,
    followersCount,
    followingCount,
    isFriend,
    friendRequestStatus,
    requestDirection,
  };
};
