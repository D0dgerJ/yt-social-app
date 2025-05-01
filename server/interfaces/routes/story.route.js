import express from "express";
import {
  createStoryController,
  getUserStoriesController,
  getFeedStoriesController,
  deleteStoryController,
  getStoriesOfFriends,
} from "../controllers/story.controller.js";
import { verifyToken } from "../../infrastructure/middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createStoryController);
router.get("/user/:userId", verifyToken, getUserStoriesController);
router.get("/feed", verifyToken, getFeedStoriesController);
router.delete("/:storyId", verifyToken, verifyStoryOwnership, deleteStoryController); // optional
router.get("/friends", verifyToken, getStoriesOfFriends);
router.post("/view/:storyId", verifyToken, handleViewStory);

export default router;