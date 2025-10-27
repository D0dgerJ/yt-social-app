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
    const messageId = Number.isFinite(Number(messageIdParam)) ? Number(messageIdParam) : undefined;

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
      res.status(400).json({ message: "Нужно указать messageId (в URL) или clientMessageId (в body)" });
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

    const { conversationDeleted } = await leaveConversation({ conversationId, userId, requestedById: userId });
    res.status(200).json({ message: conversationDeleted ? "Conversation deleted" : "Left the conversation" });
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

    const participant = await addParticipant({ conversationId, userId, addedById, role });
    res.status(201).json(participant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.chatId);
    const userId = req.user!.id;

    if (!Number.isFinite(conversationId)) {
      res.status(400).json({ message: "Некорректный chatId" });
      return;
    }

    const cursorId  = req.query.cursorId ? Number(req.query.cursorId) : null;
    const direction = (req.query.direction === "forward" ? "forward" : "backward") as "forward" | "backward";
    const limit     = req.query.limit ? Math.max(1, Math.min(100, Number(req.query.limit))) : 20;

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
    res.status(500).json({ message: error.message || "Ошибка сервера" });
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

    const { updated } = await markMessagesAsDelivered({ conversationId, userId });
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

    const { updated } = await markMessagesAsRead({ conversationId, userId });
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

    const result = await addOrUpdateReaction({ userId, messageId, emoji });

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
    const reactions = await getMessageReactions({ messageId, userId });

    res.status(200).json({ reactions });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};