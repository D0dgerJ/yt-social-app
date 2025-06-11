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
  reactToMessage 
} from "../controllers/chat.controller.ts";

import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

// Conversations
router.post("/conversations", authMiddleware, create);
router.get("/conversations", authMiddleware, getConversations);
router.get("/conversations/:conversationId/messages", authMiddleware, getConversationMessages);
router.post("/conversations/:conversationId/participants", authMiddleware, add);
router.delete("/conversations/:conversationId/leave", authMiddleware, leave);
router.post("/messages/:messageId/react", authMiddleware, reactToMessage);
router.post("/messages/mark-as-read", authMiddleware, markAsRead);
router.post("/messages/mark-as-delivered", authMiddleware, markAsDelivered);

// Messages
router.post("/messages", authMiddleware, send);

router.put(
  "/messages/:messageId",
  authMiddleware,
  checkOwnership(async (req) => {
    const message = await prisma.message.findUnique({
      where: { id: Number(req.params.messageId) },
    });
    return message?.senderId;
  }),
  update
);

router.delete(
  "/messages/:messageId",
  authMiddleware,
  checkOwnership(async (req) => {
    const message = await prisma.message.findUnique({
      where: { id: Number(req.params.messageId) },
    });
    return message?.senderId;
  }),
  remove
);

export default router;
