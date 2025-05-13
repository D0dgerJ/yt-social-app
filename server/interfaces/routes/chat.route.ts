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
} from "../controllers/chat.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

router.post("/conversations", authMiddleware, create);
router.get("/conversations", authMiddleware, getConversations);
router.post("/messages", authMiddleware, send);
router.get("/conversations/:conversationId/messages", authMiddleware, getConversationMessages);
router.post("/conversations/:conversationId/participants", authMiddleware, add);
router.delete("/:conversationId/leave", authMiddleware, leave);
router.put("/message/:messageId", authMiddleware,
  checkOwnership(async (req) => {
    const message = await prisma.message.findUnique({
      where: { id: Number(req.params.messageId) }
    });
    return message?.senderId;
  }),
  update
);

router.delete("/message/:messageId", authMiddleware,
  checkOwnership(async (req) => {
    const message = await prisma.message.findUnique({
      where: { id: Number(req.params.messageId) }
    });
    return message?.senderId;
  }),
  remove
);

export default router;
