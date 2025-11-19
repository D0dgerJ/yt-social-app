import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import prisma from "../../infrastructure/database/prismaClient.ts";
import { Request, Response } from "express";

import { createChat } from "../../application/use-cases/chat/createChat.ts";
import { sendMessage } from "../../application/use-cases/chat/sendMessage.ts";
import { getUserConversations } from "../../application/use-cases/chat/getUserConversations.ts";
import { deleteMessage } from "../../application/use-cases/chat/deleteMessage.ts";
import { updateMessage } from "../../application/use-cases/chat/updateMessage.ts";
import { leaveConversation } from "../../application/use-cases/chat/leaveConversation.ts";
import { addParticipant } from "../../application/use-cases/chat/addParticipant.ts";
import { deleteConversationIfEmpty } from "../../application/use-cases/chat/deleteConversationIfEmpty.ts";
import { markMessagesAsRead } from "../../application/use-cases/chat/markMessagesAsRead.ts";
import { markMessagesAsDelivered } from "../../application/use-cases/chat/markMessagesAsDelivered.ts";
import { addOrUpdateReaction } from "../../application/use-cases/chat/addOrUpdateReaction.ts";
import { getMessageReactions } from "../../application/use-cases/chat/getMessageReactions.ts";
import { getConversationMessages as getMsgsUC } from "../../application/use-cases/chat/getConversationMessages.ts";
import { transcribeWithWhisper } from "../../infrastructure/services/whisperService.ts";
import {
  pinConversation as pinConversationUC,
  unpinConversation as unpinConversationUC,
} from "../../application/use-cases/chat/setConversationPinned.ts";
import {
  pinMessage as pinMessageUC,
  unpinMessage as unpinMessageUC,
} from "../../application/use-cases/chat/setMessagePinned.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const create = async (req: Request, res: Response) => {
  try {
    const { userIds, name } = req.body;
    const creatorId = req.user!.id;

    const conversation = await createChat({ userIds, name, creatorId });

    res.status(201).json(conversation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversations = await getUserConversations(userId);
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const send = async (req: Request, res: Response) => {
  try {
    const senderId = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const {
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
      clientMessageId,
      attachments,
    } = req.body;

    const message = await sendMessage({
      conversationId,
      senderId,
      encryptedContent: content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
      clientMessageId,
      attachments,
    });
    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const conversationId = Number(req.params.chatId);
    const messageIdParam = req.params.messageId;
    const messageId = Number.isFinite(Number(messageIdParam))
      ? Number(messageIdParam)
      : undefined;

    const {
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
      clientMessageId,
    } = req.body;

    if (!messageId && !clientMessageId) {
      res
        .status(400)
        .json({
          message:
            "Нужно указать messageId (в URL) или clientMessageId (в body)",
        });
      return;
    }
    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const message = await updateMessage({
      messageId,
      clientMessageId,
      conversationId,
      userId,
      encryptedContent: content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      stickerUrl,
      repliedToId,
    });

    res.status(200).json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);
    const messageId = Number(req.params.messageId);

    if (!Number.isFinite(conversationId) || !Number.isFinite(messageId)) {
      res.status(400).json({ message: "Некорректные параметры" });
      return;
    }

    await deleteMessage({ messageId, userId });
    await deleteConversationIfEmpty(conversationId);

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const leave = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const { conversationDeleted } = await leaveConversation({
      conversationId,
      userId,
      requestedById: userId,
    });

    res
      .status(200)
      .json({
        message: conversationDeleted
          ? "Conversation deleted"
          : "Left the conversation",
      });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const add = async (req: Request, res: Response) => {
  try {
    const addedById = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const { userId, role } = req.body;

    const participant = await addParticipant({
      conversationId,
      userId,
      addedById,
      role,
    });

    res.status(201).json(participant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getConversationMessages = async (
  req: Request,
  res: Response
) => {
  try {
    const conversationId = Number(req.params.chatId);
    const userId = req.user!.id;

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const cursorId = req.query.cursorId ? Number(req.query.cursorId) : null;
    const direction = (req.query.direction === "forward"
      ? "forward"
      : "backward") as "forward" | "backward";
    const limit = req.query.limit
      ? Math.max(1, Math.min(100, Number(req.query.limit)))
      : 20;

    const result = await getMsgsUC({
      conversationId,
      userId,
      cursorId,
      direction,
      limit,
      markDelivered: true,
    });
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "Ошибка сервера" });
  }
};

export const markAsDelivered = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const { updated } = await markMessagesAsDelivered({
      conversationId,
      userId,
    });

    res.status(200).json({ updatedMessages: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const { updated } = await markMessagesAsRead({
      conversationId,
      userId,
    });

    res.status(200).json({ updatedMessages: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reactToMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const messageId = Number(req.params.messageId);
    const { emoji } = req.body;

    if (!Number.isFinite(messageId)) {
      res.status(400).json({ message: "Некорректный messageId" });
      return;
    }

    const result = await addOrUpdateReaction({
      userId,
      messageId,
      emoji,
    });

    res.status(200).json({ reaction: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReactions = async (req: Request, res: Response) => {
  try {
    const messageId = Number(req.params.messageId);

    if (!Number.isFinite(messageId)) {
      res.status(400).json({ message: "Некорректный messageId" });
      return;
    }

    const userId = req.user!.id;
    const reactions = await getMessageReactions({
      messageId,
      userId,
    });

    res.status(200).json({ reactions });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const transcribeMessage = async (
  req: Request,
  res: Response,
) => {
  try {
    const messageId = Number(req.params.messageId);
    const userId = req.user!.id;

    if (!Number.isFinite(messageId)) {
      res.status(400).json({ message: "Некорректный messageId" });
      return;
    }

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        mediaUrl: true,
        mediaType: true,
      },
    });

    if (!msg) {
      res.status(404).json({ message: "Сообщение не найдено" });
      return;
    }

    const participant = await prisma.participant.findFirst({
      where: {
        conversationId: msg.conversationId,
        userId,
      },
      select: { id: true },
    });

    if (!participant) {
      res.status(403).json({ message: "Нет доступа к этому сообщению" });
      return;
    }

    if (msg.mediaType !== "audio") {
      res.status(400).json({ message: "Сообщение не содержит аудио" });
      return;
    }

    if (!msg.mediaUrl) {
      res.status(400).json({ message: "У аудио-сообщения нет mediaUrl" });
      return;
    }

    let storedName: string;
    try {
      const url = new URL(msg.mediaUrl);
      storedName = url.pathname.split("/").pop() || "";
    } catch {
      storedName = msg.mediaUrl.split("/").pop() || "";
    }

    if (!storedName) {
      res.status(400).json({ message: "Не удалось извлечь имя файла из mediaUrl" });
      return;
    }

    const uploadsDir = path.resolve(__dirname, "../../uploads");
    const absPath = path.resolve(uploadsDir, storedName);

    if (!fs.existsSync(absPath)) {
      console.error("[transcribeMessage] file not found:", absPath);
      res.status(404).json({ message: "Файл для распознавания не найден" });
      return;
    }

    const text = await transcribeWithWhisper(absPath);

    res.status(200).json({ text });
  } catch (error) {
    console.error("[transcribeMessage] error:", error);
    res.status(500).json({
      message: "Не удалось распознать голосовое сообщение",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const pinConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const result = await pinConversationUC({ userId, conversationId });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unpinConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const result = await unpinConversationUC({ userId, conversationId });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const pinMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);
    const messageId = Number(req.params.messageId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    if (!Number.isFinite(messageId)) {
      res.status(400).json({ message: "Некорректный messageId" });
      return;
    }

    const result = await pinMessageUC({
      userId,
      conversationId,
      messageId,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unpinMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const conversationId = Number(req.params.chatId);
    const messageId = Number(req.params.messageId);

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    if (!Number.isFinite(messageId)) {
      res.status(400).json({ message: "Некорректный messageId" });
      return;
    }

    const result = await unpinMessageUC({
      userId,
      conversationId,
      messageId,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};