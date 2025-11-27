import prisma from "../../../infrastructure/database/prismaClient.ts";
import { extractMentions } from "./extractMentions.ts";
import { createNotification } from "./createNotification.ts";

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

  if (!usernames.length) {
    return;
  }

  const uniqueUsernames = Array.from(new Set(usernames));

  const mentionedUsers = await prisma.user.findMany({
    where: { username: { in: uniqueUsernames } },
    select: { id: true, username: true },
  });

  const snippet =
    content.length > 140 ? `${content.slice(0, 137)}...` : content;

  const tasks = mentionedUsers
    .filter((user) => user.id !== fromUserId)
    .map((user) =>
      createNotification({
        fromUserId,
        toUserId: user.id,
        type: "comment_mention",
        payload: {
          postId,
          mentionedUsername: user.username,
          snippet,
        },
      })
    );

  await Promise.all(tasks);
};
