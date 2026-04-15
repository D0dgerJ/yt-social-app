// Устанавливаем test-режим
process.env.NODE_ENV = 'test';

// ОБЯЗАТЕЛЬНО: передаётся через ENV при запуске
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Example:\n' +
      'TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/yt_social_test" npm test'
  );
}

// Жёстко задаём DATABASE_URL для Prisma
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

// Защита от случайного подключения к не-тестовой БД
if (!process.env.DATABASE_URL.includes('yt_social_test')) {
  throw new Error(
    `Tests must use test database only.\nCurrent DATABASE_URL: ${process.env.DATABASE_URL}`
  );
}

// Остальные env-переменные 
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.CORS_ORIGINS =
  'http://localhost:5173,http://127.0.0.1:5173';

process.env.STORAGE_PROVIDER = 'local';
process.env.MODERATION_OUTBOX_ENABLED = 'false';
process.env.STORY_CLEANER_ENABLED = 'false';

// Лог без утечки пароля
console.log('TEST MODE ENABLED');
console.log('Using test database: yt_social_test');