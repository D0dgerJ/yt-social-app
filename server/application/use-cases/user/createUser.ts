import prisma from "../../../infrastructure/database/prismaClient.ts";

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  profilePicture?: string;
  coverPicture?: string;
  from?: string;
  city?: string;
  relationship?: number;
  desc?: string;
}

export const createUser = async ({
  username,
  email,
  password,
  profilePicture,
  coverPicture,
  from,
  city,
  relationship,
  desc,
}: CreateUserInput) => {
  return await prisma.user.create({
    data: {
      username,
      email,
      password,
      profilePicture,
      coverPicture,
      from,
      city,
      relationship,
      desc,
    },
  });
};
