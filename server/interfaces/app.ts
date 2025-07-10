import express, { Express } from "express";
import dotenv from "dotenv";

dotenv.config();

let app: Express;

try {
  const helmet = (await import("helmet")).default;
  const morgan = (await import("morgan")).default;
  const cors = (await import("cors")).default;
  const routes = (await import("./routes/routes.ts")).default;
  const { errorHandler } = await import("../infrastructure/middleware/errorHandler.ts");

  await import("../cron/storyCleaner.ts");

  app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/api/v1", routes);
  app.use(errorHandler);
} catch (error) {
  console.error("❌ Ошибка при инициализации app.ts:", error);
  throw error;
}

export default app!;
