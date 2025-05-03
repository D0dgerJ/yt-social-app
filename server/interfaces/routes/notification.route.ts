import express from "express";
import { create, getNotifications, markAsRead } from "../controllers/notification.controller";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware, create);
router.get("/", authMiddleware, getNotifications);
router.put("/:id/read", authMiddleware, markAsRead);

export default router;
