import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { rateLimitConsume } from "../../../infrastructure/rateLimit/rateLimitConsume.js";
import { assertUserActionAllowed } from "../moderation/assertUserActionAllowed.js";
import { assertReportRateLimit } from "../moderation/assertReportRateLimit.js";

export type AbuseAction =
  | "REPORT_CREATE"
  | "POST_CREATE"
  | "POST_UPDATE"
  | "COMMENT_CREATE"
  | "MESSAGE_SEND"
  | "MESSAGE_VIEW"
  | "CHAT_CREATE"
  | "REACTION_ADD"
  | "COMMENT_UPDATE"
  | "MESSAGE_UPDATE"
  | "MESSAGE_DELETE"
  | "POST_DELETE"
  | "COMMENT_DELETE"
  | "CHAT_INVITE";

type Params = {
  actorId: number;
  action: AbuseAction;
  forbidRestricted?: boolean;
};

export async function assertActionAllowed({
  actorId,
  action,
  forbidRestricted,
}: Params) {
  if (!Number.isFinite(actorId) || actorId <= 0) {
    throw Errors.validation("Invalid actorId");
  }

  const effectiveForbidRestricted =
    typeof forbidRestricted === "boolean"
      ? forbidRestricted
      : action === "REPORT_CREATE"
        ? false
        : true;

  // 1) Санкции (ban/restrict)
  await assertUserActionAllowed({
    userId: actorId,
    forbidRestricted: effectiveForbidRestricted,
  });

  // 2) Rate limits
  switch (action) {
    case "REPORT_CREATE": {
      await assertReportRateLimit({ reporterId: actorId });
      return;
    }

    case "POST_CREATE": {
      await rateLimitConsume({
        key: `rl:post:create:user:${actorId}`,
        limit: 5,
        windowSec: 5 * 60,
      });
      return;
    }

    case "POST_UPDATE": {
      // анти-спам апдейтов: 20 апдейтов за 10 минут
      await rateLimitConsume({
        key: `rl:post:update:user:${actorId}`,
        limit: 20,
        windowSec: 10 * 60,
      });
      return;
    }

    case "COMMENT_CREATE": {
      await rateLimitConsume({
        key: `rl:comment:create:user:${actorId}`,
        limit: 30,
        windowSec: 10 * 60,
      });
      return;
    }

    case "MESSAGE_SEND": {
      await rateLimitConsume({
        key: `rl:chat:send:user:${actorId}`,
        limit: 60,
        windowSec: 60,
      });
      return;
    }

    case "MESSAGE_VIEW": {
      // view-spam защитка (особенно актуально для ephemeral maxViews)
      // 300 register-view за минуту — щедро, но режет ботов/лупы
      await rateLimitConsume({
        key: `rl:message:view:user:${actorId}`,
        limit: 300,
        windowSec: 60,
      });
      return;
    }

    case "CHAT_CREATE": {
      // защита от спама чатами/инвайтами
      await rateLimitConsume({
        key: `rl:chat:create:user:${actorId}`,
        limit: 5,
        windowSec: 10 * 60,
      });
      return;
    }

    case "REACTION_ADD": {
      await rateLimitConsume({
        key: `rl:reaction:add:user:${actorId}`,
        limit: 120,
        windowSec: 60,
      });
      return;
    }

    case "COMMENT_UPDATE": {
      // 40 правок комментариев за 10 минут
      await rateLimitConsume({
        key: `rl:comment:update:user:${actorId}`,
        limit: 40,
        windowSec: 10 * 60,
      });
      return;
    }

    case "MESSAGE_UPDATE": {
      // 60 правок сообщений за 10 минут
      await rateLimitConsume({
        key: `rl:message:update:user:${actorId}`,
        limit: 60,
        windowSec: 10 * 60,
      });
      return;
    }
    
    case "MESSAGE_DELETE": {
      // 30 удалений сообщений за 10 минут
      await rateLimitConsume({
        key: `rl:message:delete:user:${actorId}`,
        limit: 30,
        windowSec: 10 * 60,
      });
      return;
    }

    case "POST_DELETE": {
      // 10 удалений постов за 10 минут (более чем достаточно)
      await rateLimitConsume({
        key: `rl:post:delete:user:${actorId}`,
        limit: 10,
        windowSec: 10 * 60,
      });
      return;
    }

    case "COMMENT_DELETE": {
      // 60 удалений комментов/реплаев за 10 минут
      await rateLimitConsume({
        key: `rl:comment:delete:user:${actorId}`,
        limit: 60,
        windowSec: 10 * 60,
      });
      return;
    }

    case "CHAT_INVITE": {
      await rateLimitConsume({
        key: `rl:chat:invite:user:${actorId}`,
        limit: 20,
        windowSec: 10 * 60,
      });
      return;
    }

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}