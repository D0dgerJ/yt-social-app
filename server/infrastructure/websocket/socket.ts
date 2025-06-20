import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";
import prisma from "../database/prismaClient.ts";
import { markMessagesAsDelivered } from "../../application/use-cases/chat/markMessagesAsDelivered.ts";
import { markMessagesAsRead } from "../../application/use-cases/chat/markMessagesAsRead.ts";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

let io: SocketIOServer;

export const initSocket = async (server: Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  const pubClient = createClient();
  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("registerUser", async ({ userId }: { userId: number }) => {
      socket.data.userId = userId;

      const participantEntries = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      participantEntries.forEach(({ conversationId }) => {
        socket.join(String(conversationId));
      });

      await prisma.participant.updateMany({
        where: { userId },
        data: { isOnline: true },
      });

      participantEntries.forEach(({ conversationId }) => {
        socket.to(String(conversationId)).emit("userOnline", { userId });
      });
    });

    socket.on("sendMessage", (data) => {
      io.to(data.conversationId).emit("receiveMessage", data);
    });

    socket.on("markAsDelivered", async ({ conversationId }: { conversationId: number }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      await markMessagesAsDelivered({ conversationId, userId });

      socket.to(String(conversationId)).emit("messagesDelivered", {
        conversationId,
        userId,
      });
    });

    socket.on("markAsRead", async ({ conversationId }: { conversationId: number }) => {
      const userId = socket.data.userId;
      if (!userId) return;

      await markMessagesAsRead({ conversationId, userId });

      socket.to(String(conversationId)).emit("messagesRead", {
        conversationId,
        userId,
      });
    });

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
