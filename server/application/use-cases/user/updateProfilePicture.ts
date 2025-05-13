import prisma from "../../../infrastructure/database/prismaClient.ts";

interface UpdateProfilePictureInput {
  userId: number;
  profilePicture: string;
}

export const updateProfilePicture = async ({
  userId,
  profilePicture,
}: UpdateProfilePictureInput) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { profilePicture },
  });
};
