import { Request, Response } from "express";
import { createComment } from "../../application/use-cases/comment/createComment.ts";
import { deleteComment } from "../../application/use-cases/comment/deleteComment.ts";
import { updateComment } from "../../application/use-cases/comment/updateComment.ts";
import { getPostComments } from "../../application/use-cases/comment/getPostComments.ts";
import { toggleCommentLike } from "../../application/use-cases/comment/toggleCommentLike.ts";
import { getCommentReplies } from "../../application/use-cases/comment/getCommentReplies.ts";
import { updateCommentReply } from "../../application/use-cases/comment/updateCommentReply.ts";
import { deleteCommentReply } from "../../application/use-cases/comment/deleteCommentReply.ts";
import { getCommentById } from "../../application/use-cases/comment/getCommentById.ts";
import { getRepliesCountForMany } from "../../application/use-cases/comment/getRepliesCountForMany.ts";
import { getUserByUsername } from "../../application/use-cases/user/getUserByUsername.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      postId,
      content,
      files = [],
      images = [],
      videos = [],
      parentId,
    } = req.body;

    const comment = await createComment({
      userId,
      postId,
      content,
      files,
      images,
      videos,
      parentId,
    });

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const commentId = Number(req.params.commentId);
    const { content } = req.body;
    const updated = await updateComment({ commentId, content });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const commentId = Number(req.params.commentId);
    await deleteComment(commentId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const postId = Number(req.params.postId);
    const comments = await getPostComments(postId);
    res.status(200).json(comments);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const likeComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.commentId);

    const result = await toggleCommentLike({ commentId, userId });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReplies = async (req: Request, res: Response) => {
  try {
    const commentId = Number(req.params.commentId);
    const replies = await getCommentReplies(commentId);
    res.status(200).json(replies);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReply = async (req: Request, res: Response) => {
  try {
    const replyId = Number(req.params.replyId);
    const { content } = req.body;
    const updated = await updateCommentReply({ commentId: replyId, content });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const removeReply = async (req: Request, res: Response) => {
  try {
    const replyId = Number(req.params.replyId);
    await deleteCommentReply(replyId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.commentId);
    const comment = await getCommentById(id);
    res.status(200).json(comment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRepliesCountForManyHandler = async (req: Request, res: Response) => {
  try {
    const ids = req.body.ids as number[];
    const result = await getRepliesCountForMany(ids);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getProfileByUsername = async (req: Request, res: Response) => {
  try {
    const username = req.params.username;
    const currentUserId = req.user?.id;

    const userProfile = await getUserByUsername(username, currentUserId);

    res.status(200).json(userProfile);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};
