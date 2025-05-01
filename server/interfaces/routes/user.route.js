import express from "express";
import {
  getUserByIdController,
  getUserProfileController,
  updateUserController,
  deleteUserController,
  updateProfilePictureController,
  followUserController,
  unfollowUserController,
  getUserFriendsController,
} from "../controllers/user.controller.js";
import { verifyToken } from "../../infrastructure/middleware/authMiddleware.js";

const router = express.Router();

// Публичные маршруты
router.get("/:id", getUserByIdController);
router.get("/profile/:username", getUserProfileController);

// Защищённые маршруты
router.use(verifyToken);

router.put("/:id", updateUserController);
router.delete("/:id", deleteUserController);
router.put("/:id/profile-picture", updateProfilePictureController);
router.put("/:id/follow", followUserController);
router.put("/:id/unfollow", unfollowUserController);
router.get("/:id/friends", getUserFriendsController);

export default router;
