import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { authLimiter } from "../../infrastructure/middleware/rateLimit.js";
import { validate } from "../../infrastructure/middleware/validate.js";
import { registerSchema, loginSchema } from "../../validation/authSchemas.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);

export default router;