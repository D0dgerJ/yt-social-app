import prisma from "../../../infrastructure/database/prismaClient.ts";
import { privateUserSelect } from "../../serializers/user.select.ts";

interface UpdateProfilePictureInput {
  userId: number;
  profilePicture: string;
}

export const updateProfilePicture = async ({
  userId,
  profilePicture,
}: UpdateProfilePictureInput) => {
  return prisma.user.update({
    where: { id: userId },
    data: { profilePicture },
    select: privateUserSelect,
  });
};