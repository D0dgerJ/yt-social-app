import app from "./app.ts";
import { env } from "../config/env.ts";
import { cleanupEmptyPosts } from "../infrastructure/cleanup/cleanupEmptyPosts.ts";
import { createServer } from "http";
import { initSocket } from "../infrastructure/websocket/socket.ts";

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