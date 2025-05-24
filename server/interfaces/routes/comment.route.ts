import express from "express";
import * as controller from "../controllers/comment.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import { likeComment } from "../controllers/comment.controller.ts";
import { getReplies } from "../controllers/comment.controller.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

router.post("/", authMiddleware, controller.create);
router.get("/post/:postId", controller.getByPost);
router.put("/:commentId/like", authMiddleware, likeComment);
router.get("/replies/:commentId", getReplies);

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

export default router;
