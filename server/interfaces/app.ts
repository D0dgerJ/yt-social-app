import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "../config/env.ts";
import { fixLatin1ToUtf8, encodeRFC5987, asciiFallback } from "../utils/encoding.ts";
import { LOCAL_UPLOADS_DIR } from "../infrastructure/storage/storagePaths.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app: Express;

try {
  const helmet = (await import("helmet")).default;
  const morgan = (await import("morgan")).default;
  const cors = (await import("cors")).default;
  const compression = (await import("compression")).default;
  const routes = (await import("./routes/routes.ts")).default;
  const { errorHandler } = await import("../infrastructure/middleware/errorHandler.ts");
  const mime = await import("mime-types");

  await import("../cron/storyCleaner.ts");
  await import("../cron/moderationOutboxWorker.ts");

  app = express();

  app.set("trust proxy", true);

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

          const extMime = (mime.default || mime).lookup(filePath) || "";
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

  app.use("/api/v1", routes);

  app.use(errorHandler);
} catch (error) {
  console.error("❌ Ошибка при инициализации app.ts:", error);
  throw error;
}

export default app!;