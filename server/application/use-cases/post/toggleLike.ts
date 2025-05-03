import prisma from '../../../infrastructure/database/prismaClient';

interface ToggleLikeInput {
  userId: number;
  postId: number;
}

export const toggleLike = async ({ userId, postId }: ToggleLikeInput) => {
  const existing = await prisma.like.findFirst({
    where: { userId, postId },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.like.create({ data: { userId, postId } });
  return { liked: true };
};
