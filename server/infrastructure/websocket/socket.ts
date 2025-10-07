import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import prisma from "../database/prismaClient.ts";
import { sendMessage } from "../../application/use-cases/chat/sendMessage.ts";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId: number = socket.data.userId;
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`🟢 Пользователь подключён: ${userId}`);

    try {
      const conversations = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
      });
      for (const { conversationId } of conversations) {
        socket.join(String(conversationId));
      }
    } catch (err) {
      console.error("❌ Автоподключение к чатам:", err);
    }

    socket.on("joinConversation", async (conversationId: number) => {
      const isParticipant = await prisma.participant.findFirst({
        where: { userId, conversationId },
        select: { id: true },
      });
      if (isParticipant) {
        socket.join(String(conversationId));
      } else {
        socket.emit("error", "Вы не участник этого чата");
      }
    });

    socket.on("leaveConversation", async (conversationId: number) => {
      socket.leave(String(conversationId));
    });

    const handleSendMessage = async (
      messageInput: any,
      callback?: (res: { status: "ok"; message: any } | { status: "error"; error: string }) => void
    ) => {
      try {
        const fullInput = {
          ...messageInput,
          senderId: userId,
        };

        const message = await sendMessage(fullInput);

        const room = String(message.conversationId);

        socket.emit("message:ack", message);

        io.to(room).emit("receiveMessage", message);

        callback?.({ status: "ok", message });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Неизвестная ошибка";
        console.error("❌ Ошибка sendMessage:", err);
        callback?.({ status: "error", error });
      }
    };

    socket.on("message:send", handleSendMessage);
    socket.on("sendMessage", handleSendMessage);

    socket.on("messageDelivered", (p: { conversationId: number; messageId: number }) => {
      io.to(String(p.conversationId)).emit("message:delivered", p);
    });
    socket.on("messageRead", (p: { conversationId: number; messageId: number }) => {
      io.to(String(p.conversationId)).emit("message:read", p);
    });

    socket.on("typing:start", (p: { conversationId: number; username?: string; displayName?: string }) => {
      io.to(String(p.conversationId)).emit("typing:start", {
        conversationId: p.conversationId,
        userId,
        username: p.username,
        displayName: p.displayName,
        timestamp: Date.now(),
      });
    });
    socket.on("typing:stop", (p: { conversationId: number }) => {
      io.to(String(p.conversationId)).emit("typing:stop", { conversationId: p.conversationId, userId });
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Пользователь отключился: ${userId}`);
    });
  });
};

export const getIO = () => io;
