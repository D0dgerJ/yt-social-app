import { Request, Response } from "express";
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
} from '../../application/use-cases/user';


export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await getUserById(id);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    await deleteUser(id);
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const data = req.body;
    const updatedUser = await updateUser({ id, ...data });
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const { profilePicture } = req.body;
    const updatedUser = await updateProfilePicture({ userId: id, profilePicture });
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const follow = async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.id;
    const followingId = Number(req.params.id);
    await followUser({ followerId, followingId });
    res.status(200).json({ message: "Followed successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unfollow = async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.id;
    const followingId = Number(req.params.id);
    await unfollowUser({ followerId, followingId });
    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const profile = async (req: Request, res: Response) => {
  try {
    const id = req.user!.id;
    const profile = await getUserProfile(id);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const friends = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const friends = await getUserFriends(id);
    res.status(200).json(friends);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
}