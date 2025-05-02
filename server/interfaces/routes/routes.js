import express from "express";
import authRoutes from "./auth.route.js";
import userRoutes from "./user.route.js";
import postRoutes from "./post.route.js";
import storyRoutes from "./story.route.js";
import chatRoutes from "./chat.route.js";
import commentRoutes from "./comment.route.js";
import notificationRoutes from "./notification.route.js";

const router = express.Router();

// Префиксы: без "/api/v1" — он будет добавлен в server.js
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/stories", storyRoutes);
router.use("/chat", chatRoutes);
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);

export default router;
