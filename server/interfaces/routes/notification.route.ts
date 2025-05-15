import express from "express";
import {
  create,
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";

const router = express.Router();

router.post("/", authMiddleware, create);

router.get("/", authMiddleware, getNotifications);

router.put("/:id/read", authMiddleware, markAsRead);

export default router;
