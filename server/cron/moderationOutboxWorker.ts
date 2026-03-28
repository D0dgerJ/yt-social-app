import prisma from "../infrastructure/database/prismaClient.ts";
import { env } from "../config/env.ts";

const BATCH_SIZE = 10;
const INTERVAL_MS = 15_000;
const MAX_ATTEMPTS = 10;

let started = false;
let isRunning = false;

async function claimBatch() {
  const rows = await prisma.moderationOutbox.findMany({
    where: {
      status: "PENDING",
      attempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true },
  });

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);

  await prisma.moderationOutbox.updateMany({
    where: { id: { in: ids }, status: "PENDING" },
    data: { status: "PROCESSING" },
  });

  return prisma.moderationOutbox.findMany({
    where: { id: { in: ids }, status: "PROCESSING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });
}

async function processOutboxOnce() {
  if (isRunning) return;
  isRunning = true;

  try {
    const batch = await claimBatch();

    if (batch.length === 0) return;

    for (const item of batch) {
      try {
        if (!env.isProd) {
          console.log("[outbox] sending:", {
            id: item.id,
            eventType: item.eventType,
            entityType: item.entityType,
            entityId: item.entityId,
          });
        }

        await prisma.moderationOutbox.update({
          where: { id: item.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.error("[outbox] failed:", item.id, message);

        await prisma.moderationOutbox.update({
          where: { id: item.id },
          data: {
            status: "PENDING",
            attempts: { increment: 1 },
            lastError: message.slice(0, 2000),
          },
        });
      }
    }
  } finally {
    isRunning = false;
  }
}

export function startModerationOutboxWorker() {
  if (!env.MODERATION_OUTBOX_ENABLED) {
    if (!env.isProd) {
      console.log("[outbox] worker disabled by env");
    }
    return;
  }

  if (started) return;
  started = true;

  if (!env.isProd) {
    console.log(`[outbox] worker started: every ${INTERVAL_MS}ms, batch=${BATCH_SIZE}`);
  }

  processOutboxOnce().catch((error) => {
    console.error("[outbox] initial run error:", error);
  });

  setInterval(() => {
    processOutboxOnce().catch((error) => {
      console.error("[outbox] tick error:", error);
    });
  }, INTERVAL_MS);
}

startModerationOutboxWorker();