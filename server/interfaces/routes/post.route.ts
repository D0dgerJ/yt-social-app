import express from "express";
import {
  create,
  update,
  remove,
  getById,
  getUser,
  getFeed,
  like,
  save,
  unsave,
  getByUsername,
} from "../controllers/post.controller.js";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.js";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.js";
import prisma from "../../infrastructure/database/prismaClient.js";

const router = express.Router();

router.post("/", authMiddleware, create);
router.put(
  "/:id",
  authMiddleware,
  checkOwnership(async (req) => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
    });
    return post?.userId;
  }),
  update
);

router.delete(
  "/:id",
  authMiddleware,
  checkOwnership(async (req) => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
    });
    return post?.userId;
  }),
  remove
);
router.get("/:id", getById);
router.get("/user/:userId", getUser);
router.get("/", getFeed);
router.put("/:id/like", authMiddleware, like);
router.put("/:id/save", authMiddleware, save);
router.put("/:id/unsave", authMiddleware, unsave);
router.get("/username/:username", getByUsername);

export default router;
