import app from "./app.js";
import { env } from "../config/env.js";
import { cleanupEmptyPosts } from "../infrastructure/cleanup/cleanupEmptyPosts.js";
import { createServer } from "http";
import { initSocket } from "../infrastructure/websocket/socket.js";

(async () => {
  try {
    await cleanupEmptyPosts();

    const server = createServer(app);

    initSocket(server);

    server.listen(env.PORT, () => {
      console.log(`🚀 Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Ошибка при запуске сервера:", error);
  }
})();