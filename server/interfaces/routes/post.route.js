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

const router = express.Router();

router.post("/", authMiddleware, createPostController);
router.put("/:id", authMiddleware, updatePostController);
router.delete("/:id", authMiddleware, deletePostController);
router.get("/:id", getPostByIdController);
router.get("/user/:userId", getUserPostsController);
router.get("/", getAllPostsController);
router.put("/:id/like", authMiddleware, likePostController);
router.put("/:id/save", authMiddleware, savePostController);
router.put("/:id/unsave", authMiddleware, unsavePostController);

export default router;
