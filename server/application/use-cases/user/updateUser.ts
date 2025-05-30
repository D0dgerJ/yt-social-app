import prisma from "../../../infrastructure/database/prismaClient.ts";

interface UpdateUserInput {
  userId: number;
  data: {
    email?: string;
    username?: string;
    from?: string;
    city?: string;
    relationship?: number;
    coverPicture?: string;
    desc?: string;
  };
}

export const updateUser = async ({ userId, data }: UpdateUserInput) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
  });
};
