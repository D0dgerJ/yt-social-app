import prisma from "../prismaClient.js";

// Создать пост
export const createPost = async (userId, body, filePath) => {
  const newPost = await prisma.post.create({
    data: {
      userId: Number(userId),
      desc: body.desc,
      img: filePath || null, // если картинка не загружена, оставить null
    },
  });

  return newPost;
};

// Обновить пост
export const updatePost = async (params, body) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (post.userId !== Number(body.userId)) {
    throw new Error("You can update only your post");
  }

  const updatedPost = await prisma.post.update({
    where: { id: Number(params.id) },
    data: body,
  });

  return updatedPost;
};

// Удалить пост
export const deletePost = async (params, body) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  if (post.userId !== Number(body.userId)) {
    throw new Error("You can delete only your post");
  }

  await prisma.like.deleteMany({
    where: { postId: post.id },
  });

  const deletedPost = await prisma.post.delete({
    where: { id: post.id },
  });

  return deletedPost;
};

// Лайк или дизлайк поста
export const likeAndDislike = async (params, body) => {
  const postId = Number(params.id);
  const userId = Number(body.userId);

  const existingLike = await prisma.like.findFirst({
    where: { postId, userId },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    await prisma.like.create({
      data: { postId, userId },
    });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  return post;
};

// Получить один пост
export const getPost = async (params) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
  });

  return post;
};

// Получить посты для таймлайна
export const getTimelinePosts = async (params) => {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      posts: true,
      following: {
        include: {
          following: {
            include: {
              posts: true,
            },
          },
        },
      },
    },
  });

  const timelinePosts = [
    ...user.posts,
    ...user.following.flatMap(f => f.following.posts),
  ];

  return timelinePosts;
};

// Получить все посты (рандомно)
export const getAllPosts = async () => {
  const posts = await prisma.post.findMany({
    take: 40, // Ограничение на количество
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
};
