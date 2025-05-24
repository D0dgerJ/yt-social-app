import prisma from '../../../infrastructure/database/prismaClient.ts';
import { extractMentions } from "./extractMentions";

export const notifyMentions = async ({
  content,
  fromUserId,
  postId,
}: {
  content: string;
  fromUserId: number;
  postId: number;
}) => {
  const usernames = extractMentions(content);

  for (const username of usernames) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.id !== fromUserId) {
      await prisma.notification.create({
        data: {
          type: "mention",
          content,
          fromUserId,
          toUserId: user.id,
        },
      });
    }
  }
};
