import express from "express";
import {
    create as createPostController,
    update as updatePostController,
    remove as deletePostController,
    like as likePostController,
    save as savePostController,
    getUser as getUserPostsController,
    getFeed as getAllPostsController,
    getById as getPostByIdController,
    unsave as unsavePostController,
  } from "../controllers/post.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

router.post("/", authMiddleware, createPostController);
router.put("/:id", authMiddleware,
  checkOwnership(async (req) => {
    const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) }});
    return post?.userId;
  }), updatePostController);
router.delete("/:id", authMiddleware,
  checkOwnership(async (req) => {
    const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) }});
    return post?.userId;
  }), deletePostController);
router.get("/:id", getPostByIdController);
router.get("/user/:userId", getUserPostsController);
router.get("/", getAllPostsController);
router.put("/:id/like", authMiddleware, likePostController);
router.put("/:id/save", authMiddleware, savePostController);
router.put("/:id/unsave", authMiddleware, unsavePostController);

export default router;
