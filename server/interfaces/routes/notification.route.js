import express from "express";
import { create, remove, getUser, markAsRead } from "../controllers/notification.controller.js";
import verifyToken from "../../infrastructure/middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, create);
router.get("/", verifyToken, getUser);
router.put("/:id/read", verifyToken, markAsRead);
router.delete("/:id", verifyToken, remove);

export default router;
