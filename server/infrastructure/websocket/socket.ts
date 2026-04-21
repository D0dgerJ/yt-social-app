import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import prisma from "../database/prismaClient.js";
import { sendMessage } from "../../application/use-cases/chat/sendMessage.js";
import { env } from "../../config/env.js";

let io: Server;

const onlineUsers = new Map<number, Set<string>>();
const recentClientMsgs = new Map<string, { message: any; ts: number }>();

const RECENT_TTL_MS = 15_000;

const makeKey = (userId: number, clientMessageId?: string | null) =>
  clientMessageId ? `${userId}:${clientMessageId}` : null;

const addOnlineUser = (userId: number, socketId: string) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId)!.add(socketId);
};

const removeOnlineUser = (userId: number, socketId: string) => {
  const set = onlineUsers.get(userId);

  if (!set) return;

  set.delete(socketId);

  if (set.size === 0) {
    onlineUsers.delete(userId);
  }
};

const broadcastOnlineUsers = () => {
  io.emit("onlineUsers", [...onlineUsers.keys()]);
};

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId: number = socket.data.userId;
    const userRoom = `user:${userId}`;

    if (!env.isProd) {
      console.log(`🟢 Пользователь ${userId} подключён (socket=${socket.id})`);
    }

    socket.join(userRoom);

    addOnlineUser(userId, socket.id);
    broadcastOnlineUsers();

    try {
      const conversations = await prisma.participant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      for (const { conversationId } of conversations) {
        socket.join(String(conversationId));
      }
    } catch (error) {
      console.error("❌ Ошибка автоподключения к чатам:", error);
    }

    socket.on("getOnlineUsers", () => {
      socket.emit("onlineUsers", [...onlineUsers.keys()]);
    });

    socket.on("joinConversation", async (conversationId: number) => {
      const isParticipant = await prisma.participant.findFirst({
        where: { userId, conversationId },
        select: { id: true },
      });

      if (isParticipant) {
        socket.join(String(conversationId));
      } else {
        socket.emit("error", "You are not a participant in this chat");
      }
    });

    socket.on("leaveConversation", (conversationId: number) => {
      socket.leave(String(conversationId));
    });

    const handleSendMessage = async (
      messageInput: any,
      callback?: (res: { status: "ok"; message: any } | { status: "error"; error: string }) => void
    ) => {
      try {
        const clientMessageId = (messageInput?.clientMessageId ?? null) as string | null;
        const cacheKey = makeKey(userId, clientMessageId);

        if (cacheKey) {
          const cached = recentClientMsgs.get(cacheKey);

          if (cached && Date.now() - cached.ts < RECENT_TTL_MS) {
            callback?.({ status: "ok", message: cached.message });
            return;
          }
        }

        const fullInput = { ...messageInput, senderId: userId };
        const message = await sendMessage(fullInput);

        const resultKey = makeKey(userId, message?.clientMessageId ?? null);

        if (resultKey) {
          recentClientMsgs.set(resultKey, { message, ts: Date.now() });

          setTimeout(() => {
            recentClientMsgs.delete(resultKey);
          }, RECENT_TTL_MS + 1000);
        }

        const room = String(message.conversationId);

        if (!socket.rooms.has(room)) {
          socket.join(room);
        }

        socket.emit("message:ack", message);
        io.to(room).except(userRoom).emit("receiveMessage", message);

        callback?.({ status: "ok", message });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Неизвестная ошибка";

        console.error("❌ Ошибка sendMessage:", error);
        callback?.({ status: "error", error: message });
      }
    };

    socket.on("message:send", handleSendMessage);

    socket.on("messageDelivered", (payload: { conversationId: number; messageId: number }) => {
      io.to(String(payload.conversationId)).emit("message:delivered", payload);
    });

    socket.on("messageRead", (payload: { conversationId: number; messageId: number }) => {
      io.to(String(payload.conversationId)).emit("message:read", payload);
    });

    socket.on(
      "typing:start",
      (payload: { conversationId: number; username?: string; displayName?: string }) => {
        io.to(String(payload.conversationId)).emit("typing:start", {
          conversationId: payload.conversationId,
          userId,
          username: payload.username,
          displayName: payload.displayName,
          timestamp: Date.now(),
        });
      }
    );

    socket.on("typing:stop", (payload: { conversationId: number }) => {
      io.to(String(payload.conversationId)).emit("typing:stop", {
        conversationId: payload.conversationId,
        userId,
      });
    });

    socket.on("disconnect", () => {
      if (!env.isProd) {
        console.log(`🔴 Пользователь отключился: ${userId}`);
      }

      removeOnlineUser(userId, socket.id);
      broadcastOnlineUsers();
    });
  });
};

export const getIO = () => io;