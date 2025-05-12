import express from "express";
import {
  getById as getUserByIdController,
  profile as getUserProfileController,
  update as updateUserController,
  remove as deleteUserController,
  updateAvatar as updateProfilePictureController,
  follow as followUserController,
  unfollow as unfollowUserController,
  friends as getUserFriendsController,
  getByUsername as getUserByUsernameController,
} from "../controllers/user.controller";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware";

const router = express.Router();

router.get("/username/:username", getUserByUsernameController);
router.get("/:id", getUserByIdController);
router.get("/profile/:username", getUserProfileController);

router.use(authMiddleware);

router.put("/:id", updateUserController);
router.delete("/:id", deleteUserController);
router.put("/:id/profile-picture", updateProfilePictureController);
router.put("/:id/follow", followUserController);
router.put("/:id/unfollow", unfollowUserController);
router.get("/:id/friends", getUserFriendsController);

export default router;
