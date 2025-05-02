import { createComment } from "../../application/use-cases/comment/createComment.js";
import { deleteComment } from "../../application/use-cases/comment/deleteComment.js";
import { getPostComments } from "../../application/use-cases/comment/getPostComments.js";
import { updateComment } from "../../application/use-cases/comment/updateComment.js";
import { notify } from "../../application/services/notificationService.js";
import { createCommentSchema } from "../../validation/commentSchemas.js";

export const create = async (req, res, next) => {
  try {
    createCommentSchema.parse(req.body);
    
    const comment = await createComment({
      userId: req.user.id,
      postId: req.body.postId,
      content: req.body.content,
    });

    await notify({
      fromUserId: req.user.id,
      toUserId: comment.postUserId,
      type: "comment",
      content: `New comment: "${req.body.content}"`,
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

export const getByPost = async (req, res) => {
  try {
    const comments = await getPostComments(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteComment({
      commentId: req.params.commentId,
      userId: req.user.id,
      isAdmin: req.user.isAdmin,
    });
    res.json(result);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const result = await updateComment({
      commentId: req.params.commentId,
      userId: req.user.id,
      content: req.body.content,
    });
    res.json(result);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};