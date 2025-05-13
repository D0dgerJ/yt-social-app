import { Request, Response } from "express";
import { createChat } from "../../application/use-cases/chat/createChat.ts";
import { sendMessage } from "../../application/use-cases/chat/sendMessage.ts";
import { getUserConversations } from "../../application/use-cases/chat/getUserConversations.ts";
import { deleteMessage } from "../../application/use-cases/chat/deleteMessage.ts";
import { updateMessage } from "../../application/use-cases/chat/updateMessage.ts";
import { leaveConversation } from "../../application/use-cases/chat/leaveConversation.ts";
import { addParticipant } from "../../application/use-cases/chat/addParticipant.ts";
import { deleteConversationIfEmpty } from "../../application/use-cases/chat/deleteConversationIfEmpty.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

export const create = async (req: Request, res: Response) => {
  try {
    const { userIds, name } = req.body;
    const conversation = await createChat({ userIds, name });
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
    const { conversationId, content } = req.body;
    const message = await sendMessage({ conversationId, senderId, content });
    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { messageId, content } = req.body;
    const message = await updateMessage({ messageId, content });
    res.status(200).json(message);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { messageId, conversationId } = req.body;
    await deleteMessage(messageId);
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

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};