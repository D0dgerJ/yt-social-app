import prisma from "../prismaClient.js";
import bcrypt from "bcrypt";

// Обновить пользователя
export const updateUser = async (userId, updateData) => {
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: updateData,
  });

  return user;
};

// Обновить аватар
export const updateProfilePicture = async (userId, newProfilePicture) => {
  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { profilePicture: newProfilePicture },
  });

  return user;
};

// Удалить пользователя
export const deleteUser = async (userId) => {
  await prisma.user.delete({
    where: { id: Number(userId) },
  });
};

// Получить пользователя по id
export const getUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  return user;
};

// Получить пользователя по username
export const getUserProfile = async (query) => {
  const user = await prisma.user.findUnique({
    where: { username: query.username },
  });

  return user;
};

// Подписаться на пользователя
export const followUser = async (userdata, updateData) => {
  if (Number(userdata.userId) === Number(updateData.id)) {
    throw new Error("You cannot follow yourself");
  }

  // Создаём запись в таблице Follow
  await prisma.follow.create({
    data: {
      followerId: Number(userdata.userId),
      followingId: Number(updateData.id),
    },
  });
};

// Отписаться от пользователя
export const unfollowUser = async (userdata, updateData) => {
  if (Number(userdata.userId) === Number(updateData.id)) {
    throw new Error("You cannot unfollow yourself");
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: Number(userdata.userId),
      followingId: Number(updateData.id),
    },
  });
};

// Получить список друзей пользователя
export const getUserFriends = async (params) => {
  const following = await prisma.follow.findMany({
    where: { followerId: Number(params.userId) },
    include: {
      following: true,
    },
  });

  return following.map((f) => ({
    id: f.following.id,
    username: f.following.username,
    profilePicture: f.following.profilePicture,
  }));
};
