import express from "express";
import * as controller from "../controllers/comment.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

import { enforceSanctions, requireNotRestricted } from "../../infrastructure/middleware/enforceSanctions.ts";
import { optionalAuthMiddleware } from "../../infrastructure/middleware/optionalAuthMiddleware.ts";

const router = express.Router();

router.post("/", authMiddleware, enforceSanctions, requireNotRestricted, controller.create);

// Получение комментариев к посту
router.get("/post/:postId", optionalAuthMiddleware, controller.getComments);

router.post("/:commentId/report", authMiddleware, enforceSanctions, requireNotRestricted, controller.report);

// Получение ответов на конкретный комментарий (ДОЛЖНО БЫТЬ ДО "/:commentId")
router.get("/replies/:commentId", optionalAuthMiddleware, controller.getReplies);

// 📊 Получение количества ответов к нескольким комментариям
router.post("/replies-count", controller.getRepliesCountForManyHandler);

// Получение одного комментария по ID (ПОСЛЕ более конкретных маршрутов)
router.get("/:commentId", optionalAuthMiddleware, controller.getById);

// Лайк/анлайк комментария
router.put("/:commentId/like", authMiddleware, enforceSanctions, requireNotRestricted, controller.likeComment);

// Обновление
router.put(
  "/:commentId",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
  checkOwnership(async (req) => {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(req.params.commentId) },
    });
    return comment?.userId;
  }),
  controller.update
);

// Удаление
router.delete(
  "/:commentId",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
  checkOwnership(async (req) => {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(req.params.commentId) },
    });
    return comment?.userId;
  }),
  controller.remove
);

export default router;
