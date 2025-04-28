import prisma from "../prismaClient.js";
import bcrypt from "bcrypt";

export const registerUser = async (body) => {
  const hashedPassword = bcrypt.hashSync(body.password, 10);

  const newUser = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      password: hashedPassword,
    },
  });

  return newUser;
};

export const loginUser = async (body) => {
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordCheck = await bcrypt.compare(body.password, user.password);

  if (!passwordCheck) {
    throw new Error("Wrong password");
  }

  return user;
};
