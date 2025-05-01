import express from "express";
import * as controller from "../controllers/comment.controller.js";
import { verifyToken } from "../../infrastructure/middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, controller.create);
router.get("/:postId", controller.getByPost);
router.delete("/:commentId", verifyToken, controller.remove);
router.put("/:commentId", verifyToken, controller.update);

export default router;
