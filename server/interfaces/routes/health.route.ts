import { Router } from "express";
import prisma from "../../infrastructure/database/prismaClient.ts";
import { redisPub } from "../../infrastructure/redis/redisClient.ts";
import { env } from "../../config/env.ts";

const router = Router();

router.get("/", async (_req, res) => {
  let database: "up" | "down" = "down";
  let redis: "up" | "down" | "disabled" = "disabled";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  try {
    if (!redisPub) {
      redis = "disabled";
    } else if (redisPub.isReady) {
      await redisPub.ping();
      redis = "up";
    } else {
      redis = "down";
    }
  } catch {
    redis = "down";
  }

  const isHealthy = database === "up" && (redis === "up" || redis === "disabled");

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      database,
      redis,
    },
  });
});

export default router;