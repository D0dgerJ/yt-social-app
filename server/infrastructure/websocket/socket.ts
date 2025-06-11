import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";

let io: SocketIOServer;

export const initSocket = (server: Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("sendMessage", (data) => {
      io.to(data.conversationId).emit("receiveMessage", data);
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
