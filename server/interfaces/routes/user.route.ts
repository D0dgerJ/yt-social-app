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
  import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getIncomingRequests,
    getOutgoingRequests,
    cancelRequest,
    getFollowing,
    getFollowers
  } from "../controllers/user.controller.ts";
  import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";

  const router = express.Router();

  router.get("/username/:username", getUserByUsernameController);
  router.get("/profile", authMiddleware, getUserProfileController);
  router.get("/friends/:id", authMiddleware, getUserFriendsController);
  router.get("/:id", getUserByIdController);

  router.use(authMiddleware);

  router.put("/:id", updateUserController);
  router.delete("/:id", deleteUserController);
  router.put("/:id/profile-picture", updateProfilePictureController);
  router.put("/:id/follow", followUserController);
  router.put("/:id/unfollow", unfollowUserController);
  router.post("/friend-request/:id", sendFriendRequest);
  router.post("/friend-request/:id/accept", acceptFriendRequest);
  router.post("/friend-request/:id/reject", rejectFriendRequest);
  router.get("/friend-requests/incoming", getIncomingRequests);
  router.get("/friend-requests/outgoing", getOutgoingRequests);
  router.delete("/friend-request/:id", cancelRequest);
  router.get("/following/:id", getFollowing);
  router.get("/followers/:id", getFollowers);

  export default router;
