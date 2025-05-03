import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // лимит 100 запросов на IP
  message: "Too many requests, please try again later.",
});
