import { getUserById } from "../../application/use-cases/user/getUserById.js";
import { getUserProfile } from "../../application/use-cases/user/getUserProfile.js";
import { updateUser } from "../../application/use-cases/user/updateUser.js";
import { deleteUser } from "../../application/use-cases/user/deleteUser.js";
import { updateProfilePicture } from "../../application/use-cases/user/updateProfilePicture.js";
import { unfollowUser } from "../../application/use-cases/user/unfollowUser.js";
import { getUserFriends } from "../../application/use-cases/user/getUserFriends.js";
import { followUser } from "../../application/use-cases/user/followUser.js";
import { notify } from "../../application/services/notificationService.js";

// Получить пользователя по ID
export const getUserByIdController = async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Получить профиль по username
export const getUserProfileController = async (req, res, next) => {
  try {
    const user = await getUserProfile({ username: req.params.username });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Обновить данные пользователя
export const updateUserController = async (req, res, next) => {
  try {
    const updatedUser = await updateUser(req.user.id, req.body);
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
};

// Удалить пользователя
export const deleteUserController = async (req, res, next) => {
  try {
    await deleteUser(req.user.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Обновить аватар
export const updateProfilePictureController = async (req, res, next) => {
  try {
    const updated = await updateProfilePicture(req.user.id, req.body.profilePicture);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Подписаться
export const followUserController = async (req, res, next) => {
  try {
    const { targetUserId } = await followUser({
      userId: req.user.id,
      targetUserId: req.params.id,
    });

    await notify({
      fromUserId: req.user.id,
      toUserId: targetUserId,
      type: "follow",
      content: `${req.user.username} followed you`,
    });

    res.json({ message: "Followed successfully" });
  } catch (err) {
    next(err);
  }
};

// Отписаться
export const unfollowUserController = async (req, res) => {
  try {
    await unfollowUser(req.user.id, req.params.id);
    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Получить друзей
export const getUserFriendsController = async (req, res, next) => {
  try {
    const friends = await getUserFriends({ userId: req.params.id });
    res.json(friends);
  } catch (err) {
    next(err);
  }
};
