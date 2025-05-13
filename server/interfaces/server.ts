import app from './app.js';

const PORT = process.env.PORT || 5000;

try {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error("❌ Ошибка при запуске сервера:", error);
}
