import express from "express";
import {
  createChat,
  getConversations,
  sendChatMessage,
  addChatParticipant,
  getConversationMessages,
  leaveChat,
  editMessage,
  removeMessage,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../../infrastructure/middleware/authMiddleware.js";

const router = express.Router();

// Создать беседу
router.post("/conversations", verifyToken, createChat);

// Получить беседы пользователя
router.get("/conversations", verifyToken, getConversations);

// Отправить сообщение
router.post("/messages", verifyToken, sendChatMessage);

// Получить сообщения из беседы
router.get("/conversations/:conversationId/messages", verifyToken, getConversationMessages);

// Добавить участника в беседу
router.post("/conversations/:conversationId/participants", verifyToken, addChatParticipant);

// Покинуть беседу
router.delete("/:conversationId/leave", verifyToken, leaveChat);

// Обновить сообщение
router.put("/message/:messageId", verifyToken, editMessage);

// Удалить сообщение
router.delete("/message/:messageId", verifyToken, removeMessage);

export default router;
