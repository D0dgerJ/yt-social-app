import { Request, Response, NextFunction } from "express";
import { createComment } from "../../application/use-cases/comment/createComment.js";
import { deleteComment } from "../../application/use-cases/comment/deleteComment.js";
import { updateComment } from "../../application/use-cases/comment/updateComment.js";
import { getPostComments } from "../../application/use-cases/comment/getPostComments.js";
import { toggleCommentLike } from "../../application/use-cases/comment/toggleCommentLike.js";
import { getCommentReplies } from "../../application/use-cases/comment/getCommentReplies.js";
import { updateCommentReply } from "../../application/use-cases/comment/updateCommentReply.js";
import { deleteCommentReply } from "../../application/use-cases/comment/deleteCommentReply.js";
import { getCommentById } from "../../application/use-cases/comment/getCommentById.js";
import { getRepliesCountForMany } from "../../application/use-cases/comment/getRepliesCountForMany.js";
import { getUserByUsername } from "../../application/use-cases/user/getUserByUsername.js";
import { Errors } from "../../infrastructure/errors/ApiError.js";
import { reportComment } from "../../application/use-cases/comment/reportComment.js";
import { reportCommentSchema } from "../../validation/commentSchemas.js";

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
    const updated = await updateComment({ commentId, content, actorId: req.user!.id });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

    await deleteComment({
      commentId,
      actorId: req.user!.id,
      reason: typeof req.body?.reason === "string" ? req.body.reason.trim() : undefined,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

    const comments = await getPostComments(postId, req.user ? { id: req.user.id, role: req.user.role } : undefined);
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

    const replies = await getCommentReplies(commentId, req.user ? { id: req.user.id, role: req.user.role } : undefined);
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
    const updated = await updateCommentReply({ commentId: replyId, content, actorId: req.user!.id });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const removeReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const replyId = Number(req.params.replyId);
    if (!Number.isFinite(replyId) || replyId <= 0) throw Errors.validation("Invalid replyId");

    await deleteCommentReply({ commentId: replyId, actorId: req.user!.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.commentId);
    if (!Number.isFinite(id) || id <= 0) throw Errors.validation("Invalid commentId");

    const comment = await getCommentById(id, req.user ? { id: req.user.id, role: req.user.role } : undefined);
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

export const report = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = req.user!.id;

    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

    const dto = reportCommentSchema.parse(req.body);

    const created = await reportComment({
      actorId,
      commentId,
      dto,
    });

    res.status(201).json({ message: "Report submitted", report: created });
  } catch (err) {
    next(err);
  }
};
