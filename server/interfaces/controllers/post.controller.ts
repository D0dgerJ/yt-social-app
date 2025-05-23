import { Request, Response } from "express";
import {
  createPost,
  deletePost,
  getUserPosts,
  toggleLike,
  updatePost,
  savePost,
  getFeedPosts,
  getPostById,
  unsavePost,
  getUserPostsByUsername,
} from '../../application/use-cases/post/index.ts';

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { desc, images, videos, files, tags, location } = req.body;

    const post = await createPost({ userId, desc, images, videos, files, tags, location });
    res.status(201).json(post);
  } catch (error: any) {
    console.error("Post creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.id);
    const userId = Number(req.body.userId);
    const { desc, images, videos, files, tags, location } = req.body;

    const post = await updatePost({ postId, userId, desc, images, videos, files, tags, location });
    res.status(200).json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { postId } = req.body;
    await deletePost(postId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const like = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.id);
    const result = await toggleLike({ postId, userId });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const save = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.body;
    const result = await savePost({ postId, userId });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const posts = await getUserPosts(userId);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const posts = await getFeedPosts(userId);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    if (isNaN(postId)) {
      res.status(400).json({ message: "Invalid post ID" });
      return;
    }

    const post = await getPostById(postId);
    res.status(200).json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unsave = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.body;
    const result = await unsavePost({ postId, userId });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const posts = await getUserPostsByUsername(username);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getFeedById = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const posts = await getFeedPosts(userId);
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};