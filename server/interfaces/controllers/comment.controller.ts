import { Request, Response, NextFunction } from "express";
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
import { Errors } from "../../infrastructure/errors/ApiError.ts";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { postId, content, files = [], images = [], videos = [], parentId } = req.body;

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
  } catch (err) {
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

    const { content } = req.body;
    const updated = await updateComment({ commentId, content });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

    await deleteComment(commentId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

    const comments = await getPostComments(postId);
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};

export const likeComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

    const result = await toggleCommentLike({ commentId, userId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getReplies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

    const replies = await getCommentReplies(commentId);
    res.status(200).json(replies);
  } catch (err) {
    next(err);
  }
};

export const updateReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const replyId = Number(req.params.replyId);
    if (!Number.isFinite(replyId) || replyId <= 0) throw Errors.validation("Invalid replyId");

    const { content } = req.body;
    const updated = await updateCommentReply({ commentId: replyId, content });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const removeReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const replyId = Number(req.params.replyId);
    if (!Number.isFinite(replyId) || replyId <= 0) throw Errors.validation("Invalid replyId");

    await deleteCommentReply(replyId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.commentId);
    if (!Number.isFinite(id) || id <= 0) throw Errors.validation("Invalid commentId");

    const comment = await getCommentById(id);
    if (!comment) throw Errors.notFound("Comment not found");

    res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
};

export const getRepliesCountForManyHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = req.body.ids as number[];
    if (!Array.isArray(ids)) throw Errors.validation("ids must be an array of numbers");

    const result = await getRepliesCountForMany(ids);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getProfileByUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const username = req.params.username;
    const currentUserId = req.user?.id;

    const userProfile = await getUserByUsername(username, currentUserId);
    res.status(200).json(userProfile);
  } catch (err) {
    next(err);
  }
};