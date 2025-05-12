import prisma from "../../../infrastructure/database/prismaClient";

export const getUserByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      profilePicture: true,
      coverPicture: true,
      desc: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};