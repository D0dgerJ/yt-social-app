import prisma from "../../../infrastructure/database/prismaClient.js";
import { extractMentions } from "./extractMentions.js";
import { createNotification } from "./createNotification.js";
import type { NotificationType } from "./notificationTypes.js";

export interface NotifyMentionsInput {
  content: string;
  fromUserId: number;
  postId: number;
  commentId?: number;
  context?: "post" | "comment";
}

export const notifyMentions = async ({
  content,
  fromUserId,
  postId,
  commentId,
  context,
}: NotifyMentionsInput) => {
  const usernames = extractMentions(content);

  if (!usernames.length) {
    return;
  }

  const uniqueUsernames = Array.from(new Set(usernames));

  const mentionedUsers = await prisma.user.findMany({
    where: { username: { in: uniqueUsernames } },
    select: { id: true, username: true },
  });

  const trimmed = content.trim();
  const snippet =
    trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;

  const ctx: "post" | "comment" =
    context ?? (commentId ? "comment" : "comment");

  const type: NotificationType =
    ctx === "post" ? "post_mention" : "comment_mention";

  const tasks = mentionedUsers
    .filter((user) => user.id !== fromUserId)
    .map((user) =>
      createNotification({
        fromUserId,
        toUserId: user.id,
        type,
        payload: {
          postId,
          commentId: ctx === "comment" ? commentId : undefined,
          mentionedUsername: user.username,
          snippet,
        },
      })
    );

  await Promise.all(tasks);
};