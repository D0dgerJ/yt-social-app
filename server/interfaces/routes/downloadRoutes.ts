import express, { Router } from "express";
import downloadFile from "../controllers/downloadController.js";
import { downloadLimiter } from "../../infrastructure/middleware/rateLimit.js";

const router: Router = express.Router();

router.get("/uploads/:filename", downloadLimiter, downloadFile);

export default router;