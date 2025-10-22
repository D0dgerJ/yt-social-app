import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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

  app = express();
  
  app.set('trust proxy', true);

  app.use(
    "/uploads",
    express.static(path.resolve(__dirname, "../uploads"), {
      setHeaders: (res, filePath) => {
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const type = mime.lookup(filePath) || "";

        const isMedia =
          typeof type === "string" &&
          (type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/"));

        if (isMedia) {
          res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(fileName)}"`);
        } else {
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
        }

        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: "http://localhost:5173",
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
