import app from './app.ts';
import { cleanupEmptyPosts } from '../infrastructure/cleanup/cleanupEmptyPosts.ts';
import { createServer } from 'http';
import { initSocket } from '../infrastructure/websocket/socket.ts';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await cleanupEmptyPosts();

    // Создаём http.Server из express-приложения
    const server = createServer(app);

    // Инициализируем сокеты
    initSocket(server);

    // Запускаем сервер
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Ошибка при запуске сервера:", error);
  }
})();
