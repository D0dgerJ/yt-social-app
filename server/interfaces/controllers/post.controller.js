import { createPost } from "../../application/use-cases/post/createPost.js";
import { updatePost } from "../../application/use-cases/post/updatePost.js";
import { deletePost } from "../../application/use-cases/post/deletePost.js";
import { getPostById } from "../../application/use-cases/post/getPostById.js";
import { getUserPosts } from "../../application/use-cases/post/getUserPosts.js";
import { getAllPosts } from "../../application/use-cases/post/getAllPosts.js";
import { likePost } from "../../application/use-cases/post/likePost.js";
import { savePost } from "../../application/use-cases/post/savePost.js";
import { unsavePost } from "../../application/use-cases/post/unsavePost.js";
import { notify } from "../../application/services/notificationService.js";
import { createPostSchema } from "../../validation/postSchemas.js";

// Создать пост
export const createPostController = async (req, res, next) => {
  try {
    createPostSchema.parse(req.body); // Валидация

    const newPost = await createPost({
      userId: req.user.id,
      ...req.body,
    });

    res.status(201).json(newPost);
  } catch (err) {
    next(err);
  }
};

// Обновить пост
export const updatePostController = async (req, res, next) => {
  try {
    const post = await updatePost(req.params.id, req.user.id, req.body);
    res.json(post);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

// Удалить пост
export const deletePostController = async (req, res, next) => {
  try {
    await deletePost(req.params.id, req.user.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

// Получить пост по ID
export const getPostByIdController = async (req, res, next) => {
  try {
    const post = await getPostById(req.params.id);
    res.json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Получить посты пользователя
export const getUserPostsController = async (req, res, next) => {
  try {
    const posts = await getUserPosts(req.params.userId);
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// Получить все посты
export const getAllPostsController = async (req, res, next) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// Лайкнуть пост
export const likePostController = async (req, res, next) => {
  try {
    const { postUserId } = await likePost({
      userId: req.user.id,
      postId: req.params.id,
    });

    await notify({
      fromUserId: req.user.id,
      toUserId: postUserId,
      type: "like",
      content: `${req.user.username} liked your post`,
    });

    res.json({ message: "Post liked" });
  } catch (err) {
    next(err);
  }
};

// Сохранить пост
export const savePostController = async (req, res, next) => {
  try {
    const { postUserId } = await savePost({
      userId: req.user.id,
      postId: req.params.id,
    });

    await notify({
      fromUserId: req.user.id,
      toUserId: postUserId,
      type: "save",
      content: `${req.user.username} saved your post`,
    });

    res.json({ message: "Post saved" });
  } catch (err) {
    next(err);
  }
};

// Удалить из сохранённых
export const unsavePostController = async (req, res, next) => {
  try {
    await unsavePost(req.params.id, req.user.id);
    res.json({ message: "Post unsaved" });
  } catch (err) {
    next(err);
  }
};
