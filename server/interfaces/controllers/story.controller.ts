import { Request, Response } from "express";
import {
  createStory,
  deleteStory,
  getFeedStories,
  getFriendStories,
  getStoryById,
  getUserStories,
  viewStory,
} from '../../application/use-cases/story';

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { mediaUrl, mediaType, expiresAt } = req.body;
    const story = await createStory({ userId, mediaUrl, mediaType, expiresAt });
    res.status(201).json(story);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteStory(id);
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getByUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const stories = await getUserStories(userId);
    res.status(200).json(stories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stories = await getFeedStories(userId);
    res.status(200).json(stories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStoriesOfFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stories = await getFriendStories(userId);
    res.status(200).json(stories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const view = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const storyId = Number(req.params.storyId);
    await viewStory({ userId, storyId });
    res.status(200).json({ message: "Story viewed" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const storyId = Number(req.params.storyId);
    const story = await getStoryById(storyId);
    res.status(200).json(story);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};