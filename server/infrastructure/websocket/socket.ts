import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { sendMessage } from "../../application/use-cases/chat/sendMessage";
import prisma from "../database/prismaClient";

// Храним экземпляр io
let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // желательно указать конкретный фронт
      methods: ["GET", "POST"],
    },
  });

  // Middleware для авторизации по JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`🟢 Пользователь подключён: ${userId}`);

    // Подключение к комнате чата
    socket.on("joinConversation", async (conversationId: number) => {
      const isParticipant = await prisma.participant.findFirst({
        where: {
          userId,
          conversationId,
        },
      });

      if (isParticipant) {
        socket.join(String(conversationId));
        console.log(`👥 Пользователь ${userId} присоединился к комнате ${conversationId}`);
      } else {
        socket.emit("error", "Вы не участник этого чата");
      }
    });

    // Отправка сообщения
    socket.on("sendMessage", async (messageInput, callback) => {
      try {
        const fullInput = { ...messageInput, senderId: userId };
        const message = await sendMessage(fullInput);
        callback?.({ status: "ok", message }); // подтверждение клиенту
      } catch (err) {
        console.error("❌ Ошибка sendMessage:", err);
        callback?.({ status: "error", error: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Пользователь отключился: ${userId}`);
    });
  });
};

// Глобальный доступ к io
export const getIO = () => io;
