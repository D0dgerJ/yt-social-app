import express from "express";
import {
  createPostController,
  deletePostController,
  getAllPostsController,
  getPostController,
  getTimelinePostsController,
  likeAndDislikeController,
  updatePostController,
} from "../controllers/post.controller.js";
import { parser } from "../config/cloudinary.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Только авторизованный пользователь может создать пост
router.post("/create-post", verifyToken, parser.single("img"), createPostController);

// Только авторизованный пользователь может обновить пост
router.put("/update-post/:id", verifyToken, updatePostController);

// Только авторизованный пользователь может удалить пост
router.delete("/delete-post/:id", verifyToken, deletePostController);

// Только авторизованный пользователь может лайкать/дизлайкать
router.put("/like-post/:id", verifyToken, likeAndDislikeController);

// Получить конкретный пост (без токена)
router.get("/get-post/:id", getPostController);

// Получить все посты (без токена)
router.get("/", getAllPostsController);

// Получить таймлайн постов (без токена)
router.get("/get-timeline-posts/:username", getTimelinePostsController);

export default router;
