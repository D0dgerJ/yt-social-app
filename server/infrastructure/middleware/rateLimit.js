import rateLimit from "express-rate-limit";

// Ограничение для авторизации
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 запросов
  message: {
    message: "Too many attempts. Try again after 15 minutes.",
  },
  standardHeaders: true, // Включает стандартные заголовки RateLimit
  legacyHeaders: false,
});
