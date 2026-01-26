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
  getFeedById,
  getAll,
  report,
} from "../controllers/post.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import { getUserPostsFlexible } from "../controllers/post.controller.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

router.post("/", authMiddleware, create);

router.put(
  "/:id",
  authMiddleware,
  checkOwnership(async (req: express.Request): Promise<number | undefined> => {
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
  checkOwnership(async (req: express.Request): Promise<number | undefined> => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
    });
    return post?.userId;
  }),
  remove
);

router.get("/", getAll);
router.get("/feed", authMiddleware, getFeed);
router.get("/feed/:id", getFeedById);
router.get("/user", getUserPostsFlexible);
router.get("/user/:userId", getUser);
router.get("/username/:username", getByUsername);
router.post("/:id/report", authMiddleware, report);
router.get("/:id", getById);

router.put("/:id/like", authMiddleware, like);
router.put("/:id/save", authMiddleware, save);
router.put("/:id/unsave", authMiddleware, unsave);

export default router;
