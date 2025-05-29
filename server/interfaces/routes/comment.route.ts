import express from "express";
import * as controller from "../controllers/comment.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

// Комментарии и ответы (универсальный эндпоинт)
router.post("/", authMiddleware, controller.create);

// Получение комментариев к посту
router.get("/post/:postId", controller.getComments);

// Получение одного комментария по ID
router.get("/:commentId", controller.getById);

// Лайк/анлайк комментария
router.put("/:commentId/like", authMiddleware, controller.likeComment);

// Обновление комментария или ответа
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

// Удаление комментария или ответа
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

// Получение ответов на конкретный комментарий
router.get("/replies/:commentId", controller.getReplies);

// 📊 Получение количества ответов к нескольким комментариям
router.post("/replies-count", controller.getRepliesCountForManyHandler);

export default router;
