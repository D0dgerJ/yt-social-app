import { useCallback, useEffect, useState } from "react";
import { getModerationActions, type ModerationActionItem } from "@/utils/api/mod.api";

export type AlreadyHandled = {
  actionType: string;
  actor?: { id?: number; username?: string } | null;
  at?: string | null;
  reason?: string | null;
  message?: string | null;
} | null;

function deriveAlreadyHandled(items: ModerationActionItem[]): AlreadyHandled {
  // Считаем handled, если было любое “решение” по контенту
  const last =
    items.find((a) => a.actionType === "CONTENT_DELETED") ||
    items.find((a) => a.actionType === "CONTENT_HIDDEN") ||
    items.find((a) => a.actionType === "CONTENT_UNHIDDEN") ||
    items.find((a) => a.actionType === "CONTENT_SHADOW_HIDDEN") ||
    items.find((a) => a.actionType === "CONTENT_SHADOW_UNHIDDEN") ||
    null;

  if (!last) return null;

  return {
    actionType: last.actionType,
    actor: last.actor ?? null,
    at: last.createdAt,
    reason: last.reason ?? null,
    message: null,
  };
}

type Mode = "TARGET" | "SUBJECT";

/**
 * По умолчанию работает как раньше для POST/COMMENT (targetType+targetId).
 * Если нужно “историю эскалации” по пользователю-владельцу контента —
 * передай mode="SUBJECT" и targetId=userId.
 *
 * Примеры:
 * - useModerationActions(postId, "POST") -> по таргету
 * - useModerationActions(commentId, "COMMENT") -> по таргету
 * - useModerationActions(userId, "POST", "SUBJECT") -> по subjectUserId=userId (история эскалации)
 */
export function useModerationActions(
  targetId: number,
  targetType: "POST" | "COMMENT" = "POST",
  mode: Mode = "TARGET",
) {
  const [actions, setActions] = useState<ModerationActionItem[]>([]);
  const [alreadyHandled, setAlreadyHandled] = useState<AlreadyHandled>(null);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  const fetchActions = useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) return;

    setIsLoadingActions(true);
    try {
      const res =
        mode === "SUBJECT"
          ? await getModerationActions({
              subjectUserId: targetId,
              take: 50,
              skip: 0,
            })
          : await getModerationActions({
              targetType,
              targetId: String(targetId),
              take: 50,
              skip: 0,
            });

      // основной контракт сервера: items
      // fallback на actions оставлен для совместимости
      const items: ModerationActionItem[] = (res?.items ?? (res as any)?.actions ?? []) as ModerationActionItem[];

      setActions(items);
      setAlreadyHandled(deriveAlreadyHandled(items));
    } catch {
      setActions([]);
      setAlreadyHandled(null);
    } finally {
      setIsLoadingActions(false);
    }
  }, [mode, targetId, targetType]);

  const refreshActions = useCallback(async () => {
    await fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!Number.isFinite(targetId) || targetId <= 0) return;

      setIsLoadingActions(true);
      try {
        const res =
          mode === "SUBJECT"
            ? await getModerationActions({
                subjectUserId: targetId,
                take: 50,
                skip: 0,
              })
            : await getModerationActions({
                targetType,
                targetId: String(targetId),
                take: 50,
                skip: 0,
              });

        const items: ModerationActionItem[] = (res?.items ?? (res as any)?.actions ?? []) as ModerationActionItem[];
        if (cancelled) return;

        setActions(items);
        setAlreadyHandled(deriveAlreadyHandled(items));
      } catch {
        if (!cancelled) {
          setActions([]);
          setAlreadyHandled(null);
        }
      } finally {
        if (!cancelled) setIsLoadingActions(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [mode, targetId, targetType]);

  return {
    actions,
    isLoadingActions,
    alreadyHandled,
    refreshActions,
    setAlreadyHandled,
  };
}