import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";

const disabledInTest = env.NODE_ENV === "test";

export const apiLimiter = disabledInTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many requests. Please try again later.",
      },
    });

export const authLimiter = disabledInTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      message: {
        message: "Too many auth attempts. Please try again later.",
      },
    });

export const uploadLimiter = disabledInTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many uploads. Please try again later.",
      },
    });

export const reportLimiter = disabledInTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many reports. Please try again later.",
      },
    });

export const chatLimiter = disabledInTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many chat requests. Slow down.",
      },
    });

export const downloadLimiter = disabledInTest
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many download requests. Please try again later.",
      },
    });