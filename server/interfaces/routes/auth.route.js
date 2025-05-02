import express from "express";
import { login, register } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../../infrastructure/middleware/rateLimit.js";


const router = express.Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

export default router;

