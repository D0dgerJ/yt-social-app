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
} from "../controllers/chat.controller.js";

import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.js";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.js";
import prisma from "../../infrastructure/database/prismaClient.js";
import {
  enforceSanctions,
  requireNotRestricted,
} from "../../infrastructure/middleware/enforceSanctions.js";
import { chatLimiter } from "../../infrastructure/middleware/rateLimit.js";
import { validate } from "../../infrastructure/middleware/validate.js";
import {
  createChatSchema,
  sendMessageSchema,
  updateMessageSchema,
} from "../../validation/chatSchemas.js";

const router = express.Router();

router.use(chatLimiter);

// Чаты
router.post("/", authMiddleware, validate(createChatSchema), create);
router.get("/", authMiddleware, getConversations);

// Пины чатов
router.post("/:chatId/pin", authMiddleware, pinConversation);
router.delete("/:chatId/pin", authMiddleware, unpinConversation);

// Участники чата
router.post("/:chatId/participants", authMiddleware, add);
router.delete("/:chatId/leave", authMiddleware, leave);

// Сообщения
router.get("/:chatId/messages", authMiddleware, getConversationMessages);

router.post(
  "/:chatId/messages",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
  validate(sendMessageSchema),
  send
);

router.patch(
  "/:chatId/messages/:messageId",
  authMiddleware,
  validate(updateMessageSchema),
  checkOwnership(async (req) => {
    const messageId = Number(req.params.messageId);

    if (Number.isFinite(messageId) && messageId > 0) {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { senderId: true },
      });
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
  update
);

router.delete(
  "/:chatId/messages/:messageId",
  authMiddleware,
  checkOwnership(async (req) => {
    const messageId = Number(req.params.messageId);
    if (!Number.isFinite(messageId) || messageId <= 0) return undefined;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });

    return message?.senderId;
  }),
  remove
);

// Пины сообщений
router.post("/:chatId/messages/:messageId/pin", authMiddleware, pinMessage);
router.delete("/:chatId/messages/:messageId/pin", authMiddleware, unpinMessage);

// Реакции
router.post(
  "/messages/:messageId/react",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
  reactToMessage
);
router.get("/messages/:messageId/reactions", authMiddleware, getReactions);

// Транскрибация голосовых
router.post("/messages/:messageId/transcribe", authMiddleware, transcribeMessage);

// Просмотр эфемерных
router.post("/messages/:messageId/view", authMiddleware, registerView);

// Статусы сообщений
router.post("/:chatId/delivered", authMiddleware, markAsDelivered);
router.post("/:chatId/read", authMiddleware, markAsRead);

export default router;