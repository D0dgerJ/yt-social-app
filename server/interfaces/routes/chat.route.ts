import express from "express";
import {
  create,
  getConversations,
  send,
  add,
  getConversationMessages,
  leave,
  update,
  remove,
  markAsDelivered,
  markAsRead,
  reactToMessage,
  getReactions
} from "../controllers/chat.controller.ts";

import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

// Чаты
router.post("/", authMiddleware, create); // POST /api/v1/chat
router.get("/", authMiddleware, getConversations); // GET /api/v1/chat

// Участники чата
router.post("/:chatId/participants", authMiddleware, add); // POST /api/v1/chat/:chatId/participants
router.delete("/:chatId/leave", authMiddleware, leave); // DELETE /api/v1/chat/:chatId/leave

// Сообщения
router.get("/:chatId/messages", authMiddleware, getConversationMessages); // GET /api/v1/chat/:chatId/messages
router.post("/:chatId/messages", authMiddleware, send); // POST /api/v1/chat/:chatId/messages

router.patch("/:chatId/messages/:messageId", authMiddleware,
  checkOwnership(async (req) => {
    const message = await prisma.message.findUnique({
      where: { id: Number(req.params.messageId) },
    });
    return message?.senderId;
  }),
  update
); // PATCH /api/v1/chat/:chatId/messages/:messageId

router.delete("/:chatId/messages/:messageId", authMiddleware,
  checkOwnership(async (req) => {
    const message = await prisma.message.findUnique({
      where: { id: Number(req.params.messageId) },
    });
    return message?.senderId;
  }),
  remove
); // DELETE /api/v1/chat/:chatId/messages/:messageId

// Реакции
router.post("/messages/:messageId/react", authMiddleware, reactToMessage); // POST /api/v1/chat/messages/:messageId/react
router.get("/messages/:messageId/reactions", authMiddleware, getReactions); // GET /api/v1/chat/messages/:messageId/reactions

// Статусы сообщений
router.post("/:chatId/delivered", authMiddleware, markAsDelivered); // POST /api/v1/chat/:chatId/delivered
router.post("/:chatId/read", authMiddleware, markAsRead); // POST /api/v1/chat/:chatId/read

export default router;
