import express from "express";
import {
  create,
  update,
  remove,
  getById,
  getUser,
  getFeed,
  getExplore,
  like,
  save,
  unsave,
  getByUsername,
  getFeedById,
  getAll,
  report,
  searchPosts,
} from "../controllers/post.controller.js";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.js";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.js";
import { getUserPostsFlexible } from "../controllers/post.controller.js";
import prisma from "../../infrastructure/database/prismaClient.js";

import { enforceSanctions, requireNotRestricted } from "../../infrastructure/middleware/enforceSanctions.js";

const router = express.Router();

router.post("/", authMiddleware, enforceSanctions, requireNotRestricted, create);

router.put(
  "/:id",
  authMiddleware,
  enforceSanctions,
  requireNotRestricted,
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
  enforceSanctions,
  requireNotRestricted,
  checkOwnership(async (req: express.Request): Promise<number | undefined> => {
    const post = await prisma.post.findUnique({
      where: { id: Number(req.params.id) },
    });
    return post?.userId;
  }),
  remove
);

router.get("/", getAll);
router.get("/feed", authMiddleware, enforceSanctions, getFeed);
router.get("/explore", getExplore);
router.get("/search", searchPosts);
router.get("/feed/:id", getFeedById);
router.get("/user", getUserPostsFlexible);
router.get("/user/:userId", getUser);
router.get("/username/:username", getByUsername);

router.post("/:id/report", authMiddleware, enforceSanctions, requireNotRestricted, report);

router.get("/:id", getById);

router.put("/:id/like", authMiddleware, enforceSanctions, requireNotRestricted, like);
router.put("/:id/save", authMiddleware, enforceSanctions, save);
router.put("/:id/unsave", authMiddleware, enforceSanctions, unsave);

export default router;
