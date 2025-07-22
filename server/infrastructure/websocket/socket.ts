import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { sendMessage } from "../../application/use-cases/chat/sendMessage.ts";
import prisma from "../database/prismaClient.ts";

// Храним экземпляр io
let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // в проде укажи фронт
      methods: ["GET", "POST"],
    },
  });

  // Middleware авторизации
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;
    console.log(`🟢 Пользователь подключён: ${userId}`);

    // 🔁 Автоматическое присоединение ко всем чатам
    try {
      const conversations = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      conversations.forEach(({ conversationId }) => {
        socket.join(String(conversationId));
        console.log(`🔗 Пользователь ${userId} автоматически присоединился к чату ${conversationId}`);
      });
    } catch (err) {
      console.error("❌ Ошибка при авто-присоединении к чатам:", err);
    }

    // Присоединение вручную
    socket.on("joinConversation", async (conversationId: number) => {
      const isParticipant = await prisma.participant.findFirst({
        where: {
          userId,
          conversationId,
        },
      });

      if (isParticipant) {
        socket.join(String(conversationId));
        console.log(`👥 Пользователь ${userId} вручную присоединился к комнате ${conversationId}`);
      } else {
        socket.emit("error", "Вы не участник этого чата");
      }
    });

    // Отправка сообщения
    socket.on("sendMessage", async (messageInput, callback) => {
      try {
        const fullInput = {
          ...messageInput,
          senderId: userId, // ← обязательно добавляем вручную!
        };

        const message = await sendMessage(fullInput);
        callback?.({ status: "ok", message });

        // Оповещаем других участников комнаты
        socket.to(String(message.conversationId)).emit("receiveMessage", message);
      } catch (err) {
        if (err instanceof Error) {
          console.error("❌ Ошибка sendMessage:", err);
          callback?.({ status: "error", error: err.message });
        } else {
          console.error("❌ Неизвестная ошибка:", err);
          callback?.({ status: "error", error: "Неизвестная ошибка" });
        }
      }
    });

        socket.on("disconnect", () => {
          console.log(`🔴 Пользователь отключился: ${userId}`);
        });
      });
    };

// Глобальный доступ к io
export const getIO = () => io;
