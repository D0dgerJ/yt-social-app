import express from "express";
import {
  create,
  getNotifications,
  markAsRead,
  remove,
} from "../controllers/notification.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";

const router = express.Router();

// Создать уведомление вручную (обычно не нужен на фронте, но может пригодиться для админских штук)
router.post("/", authMiddleware, create);

// Получить все уведомления текущего пользователя
router.get("/", authMiddleware, getNotifications);

// Пометить уведомление прочитанным
router.put("/:id/read", authMiddleware, markAsRead);

// Удалить уведомление
router.delete("/:id", authMiddleware, remove);

export default router;
