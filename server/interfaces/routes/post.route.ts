import express from "express";
import {
  createPostController,
  updatePostController,
  deletePostController,
  getPostByIdController,
  getUserPostsController,
  getAllPostsController,
  likePostController,
  savePostController,
  unsavePostController,
} from "../controllers/post.controller.js";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.js";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.js";
import prisma from "../../infrastructure/database/prismaClient.js";

const router = express.Router();

router.post("/", authMiddleware, createPostController);
router.put(
  "/:id",
  authMiddleware,
  checkOwnership(async (req) => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
    });
    return post?.userId;
  }),
  updatePostController
);

router.delete(
  "/:id",
  authMiddleware,
  checkOwnership(async (req) => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
    });
    return post?.userId;
  }),
  deletePostController
);
router.get("/:id", getPostByIdController);
router.get("/user/:userId", getUserPostsController);
router.get("/", getAllPostsController);
router.put("/:id/like", authMiddleware, likePostController);
router.put("/:id/save", authMiddleware, savePostController);
router.put("/:id/unsave", authMiddleware, unsavePostController);

export default router;
