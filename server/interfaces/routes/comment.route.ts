import express from "express";
import * as controller from "../controllers/comment.controller";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership";
import prisma from "../../infrastructure/database/prismaClient";

const router = express.Router();

router.post("/", authMiddleware, controller.create);
router.get("/:postId", controller.getByPost);
router.delete("/:commentId", authMiddleware,
  checkOwnership(async (req) => {
    const comment = await prisma.comment.findUnique({ where: { id: Number(req.params.commentId) }});
    return comment?.userId;
  }), controller.remove);
router.put("/:commentId", authMiddleware,
  checkOwnership(async (req) => {
    const comment = await prisma.comment.findUnique({ where: { id: Number(req.params.commentId) }});
    return comment?.userId;
  }), controller.update);

export default router;
