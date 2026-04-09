import { Request, Response, NextFunction } from "express";
import {
  deleteUser,
  followUser,
  getUserById,
  getUserFriends,
  getUserProfile,
  unfollowUser,
  updateUser,
  updateProfilePicture,
  getUserByUsername,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  cancelFriendRequest,
  getUserFollowing,
  sendFriendRequest as sendFriendRequestUseCase,
  acceptFriendRequest as acceptFriendRequestUseCase,
  rejectFriendRequest as rejectFriendRequestUseCase,
  getMyTagInterests,
  getMyAuthorInterests,
  searchUsers as searchUsersUseCase,
} from "../../application/use-cases/user/index.js";
import prisma from "../../infrastructure/database/prismaClient.js";
import { Errors } from "../../infrastructure/errors/ApiError.js";
import { publicUserSelect } from "../../application/serializers/user.select.js";

function parseId(raw: unknown, message: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw Errors.validation(message);
  return n;
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id, "Invalid userId");
    const user = await getUserById(id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.id;
    await deleteUser({ actorId, userId: actorId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = req.body;

    const updatedUser = await updateUser({ userId, data });

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.id;
    const { profilePicture } = req.body;

    const updatedUser = await updateProfilePicture({ userId: id, profilePicture });
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const follow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user!.id;
    const followingId = parseId(req.params.id, "Invalid followingId");

    await followUser({ followerId, followingId });
    res.status(200).json({ message: "Followed successfully" });
  } catch (err) {
    next(err);
  }
};

export const unfollow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user!.id;
    const followingId = parseId(req.params.id, "Invalid followingId");

    await unfollowUser({ followerId, followingId });
    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (err) {
    next(err);
  }
};

export const profile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.user!.id;
    const profileData = await getUserProfile(id);
    res.status(200).json(profileData);
  } catch (err) {
    next(err);
  }
};

export const friends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id, "Invalid userId");
    const friends = await getUserFriends(id);
    res.status(200).json(friends);
  } catch (err) {
    next(err);
  }
};

export const getByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;
    if (!username || typeof username !== "string") throw Errors.validation("Invalid username");

    const user = await getUserByUsername(username);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 10;

    const currentUserId = req.user?.id;

    const items = await searchUsersUseCase({
      query: q,
      currentUserId,
      limit,
    });

    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const receiverId = parseId(req.params.id, "Invalid receiverId");

    const request = await sendFriendRequestUseCase({ senderId, receiverId });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

export const acceptFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const requestId = parseId(req.params.id, "Invalid requestId");

    const updated = await acceptFriendRequestUseCase({ requestId, currentUserId });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const rejectFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const requestId = parseId(req.params.id, "Invalid requestId");

    const updated = await rejectFriendRequestUseCase({ requestId, currentUserId });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const getIncomingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const requests = await getIncomingFriendRequests({ userId });
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};

export const getOutgoingRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const requests = await getOutgoingFriendRequests({ userId });
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};

export const cancelRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const receiverId = parseId(req.params.id, "Invalid receiverId");

    const result = await cancelFriendRequest({ senderId, receiverId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getFollowing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id, "Invalid userId");
    const following = await getUserFollowing(id);
    res.status(200).json(following.map((f: any) => f.following));
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id, "Invalid userId");

    const followers = await prisma.follow.findMany({
      where: { followingId: id },
      include: {
        follower: {
          select: publicUserSelect,
        },
      },
    });

    res.status(200).json(followers.map((f) => f.follower));
  } catch (err) {
    next(err);
  }
};

export const getMyInterestsTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const interests = await getMyTagInterests(userId);
    res.status(200).json(interests);
  } catch (err) {
    next(err);
  }
};

export const getMyInterestsAuthors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const interests = await getMyAuthorInterests(userId);
    res.status(200).json(interests);
  } catch (err) {
    next(err);
  }
};