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
  getReactions,
  transcribeMessage,
  pinConversation,
  unpinConversation,
  pinMessage,
  unpinMessage,
  registerView,  
} from "../controllers/chat.controller.ts";

import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

// Чаты
router.post("/", authMiddleware, create); // POST /api/v1/chat
router.get("/", authMiddleware, getConversations); // GET /api/v1/chat

// 📌 Пины чатов
router.post("/:chatId/pin", authMiddleware, pinConversation); // POST /api/v1/chat/:chatId/pin
router.delete("/:chatId/pin", authMiddleware, unpinConversation); // DELETE /api/v1/chat/:chatId/pin

// Участники чата
router.post("/:chatId/participants", authMiddleware, add); // POST /api/v1/chat/:chatId/participants
router.delete("/:chatId/leave", authMiddleware, leave); // DELETE /api/v1/chat/:chatId/leave

// Сообщения
router.get("/:chatId/messages", authMiddleware, getConversationMessages); // GET /api/v1/chat/:chatId/messages
router.post("/:chatId/messages", authMiddleware, send); // POST /api/v1/chat/:chatId/messages

router.patch(
  "/:chatId/messages/:messageId",
  authMiddleware,
  checkOwnership(async (req) => {
    const messageId = Number(req.params.messageId);

    if (Number.isFinite(messageId)) {
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      return message?.senderId;
    }

    const conversationId = Number(req.params.chatId);
    const clientMessageId = req.body?.clientMessageId as string | undefined;

    if (!clientMessageId || !Number.isFinite(conversationId)) return undefined;

    const message = await prisma.message.findFirst({
      where: { conversationId, clientMessageId },
      select: { senderId: true },
    });
    return message?.senderId;
  }),
  update,
); // PATCH /api/v1/chat/:chatId/messages/:messageId

router.delete(
  "/:chatId/messages/:messageId",
  authMiddleware,
  checkOwnership(async (req) => {
    const messageId = Number(req.params.messageId);
    if (isNaN(messageId)) return undefined;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    return message?.senderId;
  }),
  remove,
); // DELETE /api/v1/chat/:chatId/messages/:messageId

// 📌 Пины сообщений
router.post(
  "/:chatId/messages/:messageId/pin",
  authMiddleware,
  pinMessage,
); // POST /api/v1/chat/:chatId/messages/:messageId/pin

router.delete(
  "/:chatId/messages/:messageId/pin",
  authMiddleware,
  unpinMessage,
); // DELETE /api/v1/chat/:chatId/messages/:messageId/pin

// Реакции
router.post("/messages/:messageId/react", authMiddleware, reactToMessage); // POST /api/v1/chat/messages/:messageId/react
router.get("/messages/:messageId/reactions", authMiddleware, getReactions); // GET /api/v1/chat/messages/:messageId/reactions

// Транскрибация голосовых
router.post(
  "/messages/:messageId/transcribe",
  authMiddleware,
  transcribeMessage,
); // POST /api/v1/chat/messages/:messageId/transcribe

router.post(
  "/messages/:messageId/view",
  authMiddleware,
  registerView,
); // POST /api/v1/chat/messages/:messageId/view

// Статусы сообщений
router.post("/:chatId/delivered", authMiddleware, markAsDelivered); // POST /api/v1/chat/:chatId/delivered
router.post("/:chatId/read", authMiddleware, markAsRead); // POST /api/v1/chat/:chatId/read

export default router;