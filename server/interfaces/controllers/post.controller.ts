import { Request, Response, NextFunction } from "express";
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
  getAllPosts,
} from "../../application/use-cases/post/index.ts";
import { Errors } from "../../infrastructure/errors/ApiError.ts";

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { desc, images, videos, files, tags, location } = req.body;

    const post = await createPost({ userId, desc, images, videos, files, tags, location });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid post ID");

    const userId = req.user!.id;
    const { desc, images, videos, files, tags, location } = req.body;

    const post = await updatePost({ postId, userId, desc, images, videos, files, tags, location });
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid post ID");

    await deletePost({ postId, userId: req.user!.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const like = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid post ID");

    const result = await toggleLike({ postId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const save = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.id); // ВАЖНО: у тебя save роут = PUT "/:id/save"
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid post ID");

    const result = await savePost({ postId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const unsave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const postId = Number(req.params.id); // ВАЖНО: у тебя unsave роут = PUT "/:id/unsave"
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid post ID");

    const result = await unsavePost({ postId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

    const posts = await getUserPosts(userId);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posts = await getAllPosts();
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid post ID");

    const post = await getPostById(postId);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const getByUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username } = req.params;
    const posts = await getUserPostsByUsername(username);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getFeedById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

    const posts = await getFeedPosts(userId);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const posts = await getAllPosts();
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getUserPostsFlexible = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, username } = req.query;

    if (!userId && !username) {
      throw Errors.validation("userId or username is required");
    }

    const posts = userId
      ? await getUserPosts(Number(userId))
      : await getUserPostsByUsername(String(username));

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};