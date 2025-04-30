import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import routes from "./routes/routes.js";

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

// Маршруты
app.use(routes);

// Запуск сервера
app.listen(5000, () => {
  console.log("Server is Running on port 5000");
});
