import prisma from '../../../infrastructure/database/prismaClient';

interface UpdatePostInput {
  postId: number;
  desc?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export const updatePost = async ({ postId, desc, mediaUrl, mediaType }: UpdatePostInput) => {
  return prisma.post.update({
    where: { id: postId },
    data: {
      desc,
      mediaUrl,
      mediaType,
    },
  });
};
