import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import mime from "mime-types";

import routes from "./routes/routes.js";
import { errorHandler } from "../infrastructure/middleware/errorHandler.js";
import { env } from "../config/env.js";
import { apiLimiter } from "../infrastructure/middleware/rateLimit.js";
import {
  fixLatin1ToUtf8,
  encodeRFC5987,
  asciiFallback,
} from "../utils/encoding.js";
import { LOCAL_UPLOADS_DIR } from "../infrastructure/storage/storagePaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!env.isTest) {
  await import("../cron/storyCleaner.js");
  await import("../cron/moderationOutboxWorker.js");
}

const app: Express = express();

app.set("trust proxy", 1);

if (env.STORAGE_PROVIDER === "local") {
  app.use(
    "/uploads",
    (req, res, next): void => {
      const origin = req.headers.origin;

      if (origin && env.CORS_ORIGINS.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }

      res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, Content-Type, Accept, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }

      next();
    },
    express.static(LOCAL_UPLOADS_DIR, {
      setHeaders: (res, filePath) => {
        const storedName = path.basename(filePath);
        const fixedName = fixLatin1ToUtf8(storedName);
        const fallbackName = asciiFallback(fixedName);
        const encodedName = encodeRFC5987(fixedName);

        const extMime = mime.lookup(filePath) || "";
        const isMedia =
          typeof extMime === "string" &&
          (extMime.startsWith("image/") ||
            extMime.startsWith("video/") ||
            extMime.startsWith("audio/"));

        const dispositionType = isMedia ? "inline" : "attachment";

        res.setHeader(
          "Content-Disposition",
          `${dispositionType}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`
        );

        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );
}

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan("dev"));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    exposedHeaders: ["ETag"],
  })
);

app.use(compression());
app.use(express.json({ limit: "2mb" }));

app.use("/api/v1", apiLimiter);
app.use("/api/v1", routes);

app.use(errorHandler);

export default app;