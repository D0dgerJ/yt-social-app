import dotenv from "dotenv";
dotenv.config();

import app from "./app.ts";
import { cleanupEmptyPosts } from "../infrastructure/cleanup/cleanupEmptyPosts.ts";
import { createServer } from "http";
import { initSocket } from "../infrastructure/websocket/socket.ts";

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await cleanupEmptyPosts();

    const server = createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Ошибка при запуске сервера:", error);
  }
})();
