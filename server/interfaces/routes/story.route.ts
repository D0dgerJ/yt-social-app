import express from "express";
import {
  create as createStoryController,
  remove as deleteStoryController,
  getByUser as getUserStoriesController,
  getStoriesOfFriends as getStoriesOfFriendsController,
  view as handleViewStory,
  getFeed as getFeedStoriesController,
  getById as getStoryByIdController,
} from "../controllers/story.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.ts";
import prisma from "../../infrastructure/database/prismaClient.ts";

const router = express.Router();

router.post("/", authMiddleware, createStoryController);

router.get("/user/:userId", authMiddleware, getUserStoriesController);

router.get("/friends", authMiddleware, getStoriesOfFriendsController);

router.get("/feed", authMiddleware, getFeedStoriesController);

router.post("/view/:storyId", authMiddleware, handleViewStory);

router.get("/:storyId", authMiddleware, getStoryByIdController);

router.delete("/:storyId", authMiddleware,
  checkOwnership(async (req) => {
    const story = await prisma.story.findUnique({
      where: { id: Number(req.params.storyId) }
    });
    return story?.userId;
  }),
  deleteStoryController
);

export default router;
