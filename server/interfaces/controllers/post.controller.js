import { createPost } from "../../application/use-cases/post/createPost.js";
import { updatePost } from "../../application/use-cases/post/updatePost.js";
import { deletePost } from "../../application/use-cases/post/deletePost.js";
import { getPostById } from "../../application/use-cases/post/getPostById.js";
import { getUserPosts } from "../../application/use-cases/post/getUserPosts.js";
import { getAllPosts } from "../../application/use-cases/post/getAllPosts.js";
import { likePost } from "../../application/use-cases/post/likePost.js";
import { savePost } from "../../application/use-cases/post/savePost.js";
import { unsavePost } from "../../application/use-cases/post/unsavePost.js";

// Создать пост
export const createPostController = async (req, res) => {
  try {
    const newPost = await createPost({ userId: req.user.id, ...req.body });
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Обновить пост
export const updatePostController = async (req, res) => {
  try {
    const post = await updatePost(req.params.id, req.user.id, req.body);
    res.json(post);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

// Удалить пост
export const deletePostController = async (req, res) => {
  try {
    await deletePost(req.params.id, req.user.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

// Получить пост по ID
export const getPostByIdController = async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    res.json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Получить посты пользователя
export const getUserPostsController = async (req, res) => {
  try {
    const posts = await getUserPosts(req.params.userId);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Получить все посты
export const getAllPostsController = async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Лайкнуть пост
export const likePostController = async (req, res) => {
  try {
    await likePost(req.params.id, req.user.id);
    res.json({ message: "Post liked/unliked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Сохранить пост
export const savePostController = async (req, res) => {
  try {
    await savePost(req.params.id, req.user.id);
    res.json({ message: "Post saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Удалить из сохранённых
export const unsavePostController = async (req, res) => {
  try {
    await unsavePost(req.params.id, req.user.id);
    res.json({ message: "Post unsaved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
