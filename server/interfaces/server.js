import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes/routes.js";
import "../cron/storyCleaner.js";
import { errorHandler } from "../infrastructure/middleware/errorHandler.js";

dotenv.config();

const app = express();

// Проверка сервера
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.use(helmet());
app.use(morgan("common"));
app.use(cors());
app.use(express.json());

// Все маршруты через один файл
app.use("/api/v1", routes);

// (следующий шаг добавим errorHandler ниже)
app.use(errorHandler);

app.listen(5000, () => {
  console.log("Server is Running on port 5000");
});
