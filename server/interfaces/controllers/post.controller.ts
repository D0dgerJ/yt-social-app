import { Request, Response } from "express";
import { createPost } from "../../application/use-cases/post/createPost";
import { deletePost } from "../../application/use-cases/post/deletePost";
import { getUserPosts } from "../../application/use-cases/post/getUserPosts";
import { toggleLike } from "../../application/use-cases/post/toggleLike";
import { updatePost } from "../../application/use-cases/post/updatePost";
import { savePost } from "../../application/use-cases/post/savePost";
import { getFeedPosts } from "../../application/use-cases/post/getFeedPosts";
import { getPostById } from "../../application/use-cases/post/getPostById";
import { unsavePost } from "../../application/use-cases/post/unsavePost";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { desc, mediaUrl, mediaType } = req.body;
    const post = await createPost({ userId, desc, mediaUrl, mediaType });
    res.status(201).json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { postId, desc, mediaUrl, mediaType } = req.body;
    const updated = await updatePost({ postId, desc, mediaUrl, mediaType });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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
    const { postId } = req.body;
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

export const getById = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.id);
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