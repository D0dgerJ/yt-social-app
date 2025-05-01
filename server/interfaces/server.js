import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes/routes.js";
import authRoutes from "../interfaces/routes/auth.route.js";
import postRoutes from "../interfaces/routes/post.route.js";
import "../cron/storyCleaner.js";
import notificationRoutes from "../interfaces/routes/notification.route.js";
import commentRoutes from "../interfaces/routes/comment.route.js";
import chatRoutes from "../interfaces/routes/chat.route.js";

const app = express();
dotenv.config();

// Проверка сервера
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.use(helmet());
app.use(morgan("common"));
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chat", chatRoutes);

// Маршруты
app.use(routes);

// Запуск сервера
app.listen(5000, () => {
  console.log("Server is Running on port 5000");
});

