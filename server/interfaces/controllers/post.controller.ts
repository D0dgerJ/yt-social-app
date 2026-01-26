import type { Request, Response, NextFunction } from "express";
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
  reportPost, 
} from "../../application/use-cases/post/index.ts";
import { Errors } from "../../infrastructure/errors/ApiError.ts";

function parseId(raw: unknown, message: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw Errors.validation(message);
  return n;
}

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
    const postId = parseId(req.params.id, "Invalid post ID");
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
    const postId = parseId(req.params.id, "Invalid post ID");
    await deletePost({ postId, userId: req.user!.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const like = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const postId = parseId(req.params.id, "Invalid post ID");

    const result = await toggleLike({ postId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const save = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const postId = parseId(req.params.id, "Invalid post ID");

    const result = await savePost({ postId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const unsave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const postId = parseId(req.params.id, "Invalid post ID");

    const result = await unsavePost({ postId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseId(req.params.userId, "Invalid userId");
    const posts = await getUserPosts(userId);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const posts = await getFeedPosts(userId);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = parseId(req.params.id, "Invalid post ID");
    const post = await getPostById(postId);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

export const getByUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username } = req.params;
    if (!username || typeof username !== "string") throw Errors.validation("Invalid username");

    const posts = await getUserPostsByUsername(username);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const getFeedById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseId(req.params.id, "Invalid userId");
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
      ? await getUserPosts(parseId(userId, "Invalid userId"))
      : await getUserPostsByUsername(String(username));

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

export const report = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = parseId(req.params.id, "Invalid post ID");
    const reporterId = req.user!.id;

    const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
    const message = typeof req.body?.message === "string" ? req.body.message : undefined;

    const result = await reportPost({ postId, reporterId, reason, message });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
