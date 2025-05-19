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
} from "../controllers/user.controller.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";

const router = express.Router();

// ⚠️ Порядок имеет значение!
// Более специфичные маршруты должны быть выше

router.get("/username/:username", getUserByUsernameController);
router.get("/profile", authMiddleware, getUserProfileController);
router.get("/friends/:id", authMiddleware, getUserFriendsController);
router.get("/:id", getUserByIdController); // должен быть в самом конце

// ⬇️ Всё, что требует авторизации — ниже
router.use(authMiddleware);

router.put("/:id", updateUserController);
router.delete("/:id", deleteUserController);
router.put("/:id/profile-picture", updateProfilePictureController);
router.put("/:id/follow", followUserController);
router.put("/:id/unfollow", unfollowUserController);

export default router;
