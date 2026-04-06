import express from "express";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/eventController.js";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.js";

const router = express.Router();

// Создать событие
router.post("/", authMiddleware, create);

// Получить события за период
router.get("/", authMiddleware, getAll);

// Обновить событие
router.patch("/:id", authMiddleware, update);

// Удалить событие
router.delete("/:id", authMiddleware, remove);

export default router;
