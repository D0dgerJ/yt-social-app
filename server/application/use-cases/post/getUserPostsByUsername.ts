import prisma from "../../../infrastructure/database/prismaClient";

export const getUserPostsByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) throw new Error("User not found");

  const posts = await prisma.post.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          username: true,
          profilePicture: true,
        },
      },
    },
  });

  return posts;
};
