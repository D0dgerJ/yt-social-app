import { useCallback, useEffect, useState } from "react";
import {
  getModerationActions,
  type ModerationActionItem,
} from "@/utils/api/mod.api";

export type AlreadyHandled = {
  actionType: string;
  actor?: { id?: number; username?: string } | null;
  at?: string | null;
  reason?: string | null;
  message?: string | null;
} | null;

function deriveAlreadyHandled(items: ModerationActionItem[]): AlreadyHandled {
  const last =
    items.find((a) => a.actionType === "CONTENT_DELETED") ||
    items.find((a) => a.actionType === "CONTENT_HIDDEN") ||
    items.find((a) => a.actionType === "CONTENT_UNHIDDEN") ||
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

export function useModerationActions(postId: number) {
  const [actions, setActions] = useState<ModerationActionItem[]>([]);
  const [alreadyHandled, setAlreadyHandled] = useState<AlreadyHandled>(null);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  const refreshActions = useCallback(async () => {
    setIsLoadingActions(true);
    try {
      const res = await getModerationActions({
        targetType: "POST",
        targetId: String(postId),
        take: 50,
        skip: 0,
      });

      const items: ModerationActionItem[] = res?.items ?? res?.actions ?? [];
      setActions(items);
      setAlreadyHandled(deriveAlreadyHandled(items));
    } finally {
      setIsLoadingActions(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!Number.isFinite(postId) || postId <= 0) return;

    let cancelled = false;

    async function loadActions() {
      setIsLoadingActions(true);
      try {
        const res = await getModerationActions({
          targetType: "POST",
          targetId: String(postId),
          take: 50,
          skip: 0,
        });

        const items: ModerationActionItem[] = res?.items ?? res?.actions ?? [];
        if (cancelled) return;

        setActions(items);
        setAlreadyHandled(deriveAlreadyHandled(items));
      } catch {
        if (!cancelled) setActions([]);
      } finally {
        if (!cancelled) setIsLoadingActions(false);
      }
    }

    void loadActions();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  return {
    actions,
    isLoadingActions,
    alreadyHandled,
    refreshActions,
    setAlreadyHandled, // нужно для 409 alreadyHandled (поведение как было)
  };
}
