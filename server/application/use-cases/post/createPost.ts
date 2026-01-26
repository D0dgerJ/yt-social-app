import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

interface CreatePostInput {
  userId: number;
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export const createPost = async ({
  userId,
  desc,
  images = [],
  videos = [],
  files = [],
  tags = [],
  location,
}: CreatePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

  const cleanLocation =
    typeof location === "string" ? location.trim() : undefined;

  return prisma.post.create({
    data: {
      userId,
      desc,
      images,
      videos,
      files,
      tags,
      location: cleanLocation ? cleanLocation : null,
    },
  });
};
