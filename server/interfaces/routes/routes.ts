import express from "express";

import authRoutes from "./auth.route.ts";
import postRoutes from "./post.route.ts";
import userRoutes from "./user.route.ts";
import storyRoutes from "./story.route.ts";
import commentRoutes from "./comment.route.ts";
import notificationRoutes from "./notification.route.ts";
import chatRoutes from "./chat.route.ts";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/stories", storyRoutes);
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/chat", chatRoutes);

export default router;
