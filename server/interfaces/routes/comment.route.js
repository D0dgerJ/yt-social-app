import express from "express";
import * as controller from "../controllers/comment.controller.js";
import { verifyToken } from "../../infrastructure/middleware/authMiddleware.js";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.js";
import prisma from "../../infrastructure/database/prismaClient.js";

const router = express.Router();

router.post("/", verifyToken, controller.create);
router.get("/:postId", controller.getByPost);
router.delete(
    "/:commentId",
    verifyToken,
   checkOwnership(async (req) => {
     const comment = await prisma.comment.findUnique({
       where: { id: Number(req.params.commentId) },
    });
     return comment?.userId;
   }),
    controller.remove
  );
  router.put(
    "/:commentId",
    verifyToken,
   checkOwnership(async (req) => {
     const comment = await prisma.comment.findUnique({
       where: { id: Number(req.params.commentId) },
     });
     return comment?.userId;
   }),
    controller.update
  );

export default router;
