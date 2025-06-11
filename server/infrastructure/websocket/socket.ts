import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import prisma from "../database/prismaClient";
import { markMessagesAsDelivered } from "../../application/use-cases/chat/markMessagesAsDelivered";
import { markMessagesAsRead } from "../../application/use-cases/chat/markMessagesAsRead";

let io: SocketIOServer;

export const initSocket = (server: Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Сохраняем userId в сокете
    socket.on("registerUser", async ({ userId }: { userId: number }) => {
      socket.data.userId = userId;

      // Найдём все беседы, где он участвует
      const participantEntries = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      // Присоединим к комнатам
      participantEntries.forEach(({ conversationId }) => {
        socket.join(String(conversationId));
      });

      // Обновим статус в БД
      await prisma.participant.updateMany({
        where: { userId },
        data: { isOnline: true },
      });

      // Оповестим участников бесед
      participantEntries.forEach(({ conversationId }) => {
        socket.to(String(conversationId)).emit("userOnline", { userId });
      });
    });

    // Сообщения
    socket.on("sendMessage", (data) => {
      io.to(data.conversationId).emit("receiveMessage", data);
    });

    socket.on("markAsDelivered", async ({ conversationId }: { conversationId: number }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      const result = await markMessagesAsDelivered({ conversationId, userId });

      // Уведомление участников (можно убрать если не требуется в UI)
      socket.to(String(conversationId)).emit("messagesDelivered", {
        conversationId,
        userId,
      });
    });

    socket.on("markAsRead", async ({ conversationId }: { conversationId: number }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      const count = await markMessagesAsRead({ conversationId, userId });

      socket.to(String(conversationId)).emit("messagesRead", {
        conversationId,
        userId,
      });
    });

    // При отключении
    socket.on("disconnecting", async () => {
      const userId = socket.data.userId;
      if (!userId) return;

      const rooms = [...socket.rooms].filter((r) => r !== socket.id);

      await prisma.participant.updateMany({
        where: { userId },
        data: { isOnline: false },
      });

      rooms.forEach((roomId) => {
        socket.to(roomId).emit("userOffline", { userId });
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
