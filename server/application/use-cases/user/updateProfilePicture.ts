import prisma from "../../../infrastructure/database/prismaClient.js";
import { privateUserSelect } from "../../serializers/user.select.js";

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