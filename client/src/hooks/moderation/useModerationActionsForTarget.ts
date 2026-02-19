import { useEffect, useState } from "react";
import {
  getModerationActions,
  type ModerationActionItem,
  type ModerationTargetType,
} from "@/utils/api/mod.api";

export type AlreadyHandled = {
  actionType: string;
  actor?: { id?: number; username?: string } | null;
  at?: string | null;
  reason?: string | null;
  message?: string | null;
} | null;

// “Already handled” — если есть любое решение/действие (кроме REPORT_CREATED), считаем что кейс трогали
function deriveAlreadyHandled(items: ModerationActionItem[]): AlreadyHandled {
  const firstNonCreate = items.find((a) => a.actionType !== "REPORT_CREATED") ?? null;
  if (!firstNonCreate) return null;

  return {
    actionType: firstNonCreate.actionType,
    actor: firstNonCreate.actor ?? null,
    at: firstNonCreate.createdAt,
    reason: firstNonCreate.reason ?? null,
    message: null,
  };
}

export function useModerationActionsForTarget(
  targetType: ModerationTargetType,
  targetId: string
) {
  const [actions, setActions] = useState<ModerationActionItem[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  const [alreadyHandled, setAlreadyHandled] = useState<AlreadyHandled>(null);

  async function refreshActions() {
    if (!targetId) return;

    setIsLoadingActions(true);
    try {
      const data = await getModerationActions({ targetType, targetId, take: 50, skip: 0 });
      const items = (data?.items ?? []) as ModerationActionItem[];

      setActions(items);
      setAlreadyHandled(deriveAlreadyHandled(items));
    } finally {
      setIsLoadingActions(false);
    }
  }

  useEffect(() => {
    void refreshActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  return { actions, isLoadingActions, alreadyHandled, refreshActions, setAlreadyHandled };
}