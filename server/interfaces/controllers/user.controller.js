import { getUserById } from "../../application/use-cases/user/getUserById.js";
import { getUserProfile } from "../../application/use-cases/user/getUserProfile.js";
import { updateUser } from "../../application/use-cases/user/updateUser.js";
import { deleteUser } from "../../application/use-cases/user/deleteUser.js";
import { updateProfilePicture } from "../../application/use-cases/user/updateProfilePicture.js";
import { followUser } from "../../application/use-cases/user/followUser.js";
import { unfollowUser } from "../../application/use-cases/user/unfollowUser.js";
import { getUserFriends } from "../../application/use-cases/user/getUserFriends.js";

// Получить пользователя по ID
export const getUserByIdController = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Получить профиль по username
export const getUserProfileController = async (req, res) => {
  try {
    const user = await getUserProfile({ username: req.params.username });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Обновить данные пользователя
export const updateUserController = async (req, res) => {
  try {
    const updatedUser = await updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Удалить пользователя
export const deleteUserController = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Обновить аватар
export const updateProfilePictureController = async (req, res) => {
  try {
    const updated = await updateProfilePicture(req.params.id, req.body.profilePicture);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Подписаться
export const followUserController = async (req, res) => {
  try {
    await followUser({ userId: req.user.id }, { id: req.params.id });
    res.json({ message: "Followed successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Отписаться
export const unfollowUserController = async (req, res) => {
  try {
    await unfollowUser({ userId: req.user.id }, { id: req.params.id });
    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Получить друзей
export const getUserFriendsController = async (req, res) => {
  try {
    const friends = await getUserFriends({ userId: req.params.id });
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
