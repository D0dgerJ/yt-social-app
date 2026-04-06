import express from "express";

import authRoutes from "./auth.route.js";
import postRoutes from "./post.route.js";
import userRoutes from "./user.route.js";
import storyRoutes from "./story.route.js";
import commentRoutes from "./comment.route.js";
import notificationRoutes from "./notification.route.js";
import chatRoutes from "./chat.route.js";
import uploadRoutes from "./uploadRoutes.js";
import downloadRoutes from "./downloadRoutes.js";
import eventRoutes from "./eventRoutes.js";
import modRoute from "./mod.route.js";
import healthRoutes from "./health.route.js";

import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.js";
import {
  enforceSanctions,
  requireNotRestricted,
} from "../../infrastructure/middleware/enforceSanctions.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/stories", storyRoutes);
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/chat", chatRoutes);
router.use(
  "/events",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
  eventRoutes
);

router.use(
  "/upload",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
  uploadRoutes
);

router.use("/download", downloadRoutes);
router.use("/mod", modRoute);

export default router;