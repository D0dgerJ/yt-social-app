import express from "express";
import {
  createStoryController,
  getUserStoriesController,
  getFeedStoriesController,
  deleteStoryController,
  getStoriesOfFriends,
} from "../controllers/story.controller.js";
import { verifyToken } from "../../infrastructure/middleware/authMiddleware.js";
import { checkOwnership } from "../../infrastructure/middleware/checkOwnership.js";
import prisma from "../../infrastructure/database/prismaClient.js";


const router = express.Router();

router.post("/", verifyToken, createStoryController);
router.get("/user/:userId", verifyToken, getUserStoriesController);
router.get("/feed", verifyToken, getFeedStoriesController);
router.delete(
  "/:storyId",
  verifyToken,
 checkOwnership(async (req) => {
   const story = await prisma.story.findUnique({
     where: { id: Number(req.params.storyId) },
   });
   return story?.userId;
 }),
  deleteStoryController
);
router.get("/friends", verifyToken, getStoriesOfFriends);
router.post("/view/:storyId", verifyToken, handleViewStory);

export default router;