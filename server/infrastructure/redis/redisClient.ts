import { createClient } from "redis";
import { env } from "../../config/env.js";

const redisUrl = env.REDIS_URL;

const redisPub = redisUrl ? createClient({ url: redisUrl }) : null;
const redisSub = redisUrl ? createClient({ url: redisUrl }) : null;

if (redisPub) {
  redisPub.on("error", (err) => {
    console.error("Redis Publisher Error:", err);
  });
}

if (redisSub) {
  redisSub.on("error", (err) => {
    console.error("Redis Subscriber Error:", err);
  });
}

if (redisPub && redisSub) {
  Promise.all([redisPub.connect(), redisSub.connect()])
    .then(() => {
      if (!env.isProd) {
        console.log("✅ Redis Pub/Sub подключены");
      }
    })
    .catch((err) => {
      console.error("❌ Ошибка подключения к Redis:", err);
    });
} else if (!env.isProd) {
  console.log("ℹ️ Redis disabled: REDIS_URL is not set");
}

export { redisPub, redisSub };