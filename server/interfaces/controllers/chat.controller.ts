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
import prisma from "../../infrastructure/database/prismaClient.ts";

export const create = async (req: Request, res: Response) => {
  try {
    const { userIds, name } = req.body;
    const conversation = await createChat({ userIds: userIds, name });
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
    const {
      conversationId,
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      repliedToId,
    } = req.body;

    const message = await sendMessage({
      conversationId,
      senderId,
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
      repliedToId,
    });

    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


export const update = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { messageId, content, mediaUrl, mediaType, fileName, gifUrl, repliedToId } = req.body;

    const message = await updateMessage({
      messageId,
      userId,
      content,
      mediaUrl,
      mediaType,
      fileName,
      gifUrl,
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
    const { messageId, conversationId } = req.body;

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
    const { conversationId } = req.body;
    await leaveConversation({ conversationId, userId });
    await deleteConversationIfEmpty(conversationId);
    res.status(200).json({ message: "Left the conversation" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const add = async (req: Request, res: Response) => {
  try {
    const { conversationId, userId } = req.body;
    const participant = await addParticipant({ conversationId, userId });
    res.status(201).json(participant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          repliedTo: {
            select: {
              id: true,
              content: true,
              mediaUrl: true,
              mediaType: true,
              senderId: true,
            },
          },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    res.status(200).json({
      page,
      limit,
      total,
      messages,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markAsDelivered = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.body;

    const count = await markMessagesAsDelivered({ conversationId, userId });
    res.status(200).json({ updatedMessages: count });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.body;

    const count = await markMessagesAsRead({ conversationId, userId });
    res.status(200).json({ updatedMessages: count });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reactToMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { messageId, emoji } = req.body;

    const result = await addOrUpdateReaction({ userId, messageId, emoji });

    res.status(200).json({ reaction: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReactions = async (req: Request, res: Response) => {
  try {
    const messageId = Number(req.params.messageId);
    const reactions = await getMessageReactions(messageId);
    res.status(200).json({ reactions });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};