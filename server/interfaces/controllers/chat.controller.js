import { createChat as createChatUseCase } from "../../application/use-cases/chat/createChat.js";
import { getUserConversations } from "../../application/use-cases/chat/getUserConversations.js";
import { sendMessage } from "../../application/use-cases/chat/sendMessage.js";
import { addParticipant } from "../../application/use-cases/chat/addParticipant.js";
import prisma from "../../infrastructure/database/prismaClient.js";

export const createChat = async (req, res) => {
  try {
    const { userIds, name } = req.body;
    const conversation = await createChatUseCase({ creatorId: req.user.id, userIds, name });
    res.status(201).json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await getUserConversations(Number(userId));
    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const { conversationId, content, mediaUrl } = req.body;
    const message = await sendMessage({ conversationId, senderId: req.user.id, content, mediaUrl });
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addChatParticipant = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;
    const participant = await addParticipant({ conversationId, userId });
    res.status(201).json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId: Number(conversationId) },
      include: {
        sender: {
          select: { id: true, username: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Покинуть беседу
export const leaveChat = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await leaveConversation({ userId, conversationId: Number(conversationId) });
    res.status(200).json({ message: "You left the conversation" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Обновить сообщение
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const updated = await updateMessage({ messageId: Number(messageId), userId, content });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Удалить сообщение
export const removeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    await deleteMessage({ messageId: Number(messageId), userId });
    res.status(200).json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};