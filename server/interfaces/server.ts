import app from './app.ts';
import { cleanupEmptyPosts } from '../infrastructure/cleanup/cleanupEmptyPosts.ts';

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await cleanupEmptyPosts();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Ошибка при запуске сервера:", error);
  }
})();