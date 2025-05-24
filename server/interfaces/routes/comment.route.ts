import express from "express";
import * as controller from "../controllers/comment.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

// Комментарии
router.post("/", authMiddleware, controller.create);
router.get("/post/:postId", controller.getComments);
router.get("/:commentId", controller.getById);
router.put("/:commentId/like", authMiddleware, controller.likeComment);

// Обновление и удаление комментариев
router.put(
  "/:commentId",
  authMiddleware,
  checkOwnership(async (req) => {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(req.params.commentId) },
    });
    return comment?.userId;
  }),
  controller.update
);

router.delete(
  "/:commentId",
  authMiddleware,
  checkOwnership(async (req) => {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(req.params.commentId) },
    });
    return comment?.userId;
  }),
  controller.remove
);

// Ответы
router.post("/reply", authMiddleware, controller.reply);
router.get("/replies/:commentId", controller.getReplies);

// Обновление ответа
router.put(
  "/reply/:replyId",
  authMiddleware,
  checkOwnership(async (req) => {
    const reply = await prisma.comment.findUnique({
      where: { id: Number(req.params.replyId) },
    });
    return reply?.userId;
  }),
  controller.updateReply
);

// Удаление ответа
router.delete(
  "/reply/:replyId",
  authMiddleware,
  checkOwnership(async (req) => {
    const reply = await prisma.comment.findUnique({
      where: { id: Number(req.params.replyId) },
    });
    return reply?.userId;
  }),
  controller.removeReply
);

// 📊 Количество ответов к комментариям
router.post("/replies-count", controller.getRepliesCountForManyHandler);

export default router;
