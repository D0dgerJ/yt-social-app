import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  getModerationActionById,
  getModerationActionEvidence,
  type ModerationActionItem,
} from "@/utils/api/mod.api";

import styles from "./ModerationActionModal.module.scss";

type Props = {
  open: boolean;
  actionId: number | null;
  onClose: () => void;
};

export default function ModerationActionModal({ open, actionId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ModerationActionItem | null>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const title = useMemo(() => {
    if (!action) return "Moderation Action";
    return `${action.actionType} · ${action.targetType} #${action.targetId}`;
  }, [action]);

  // ESC close
  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // load action + evidence
  useEffect(() => {
    if (!open) return;

    if (actionId === null) {
      setAction(null);
      setEvidence(null);
      setError("");
      return;
    }

    const id = actionId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [aRes, eRes] = await Promise.all([
          getModerationActionById(id),
          getModerationActionEvidence(id),
        ]);

        if (cancelled) return;

        const actionItem = (aRes?.item ?? aRes?.action ?? aRes) as ModerationActionItem;
        setAction(actionItem);

        setEvidence(eRes?.evidence ?? eRes?.item ?? eRes ?? null);
      } catch (e: any) {
        if (cancelled) return;
        setAction(null);
        setEvidence(null);
        setError(e?.message || "Failed to load action");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, actionId]);

  if (!open) return null;

  const modal = (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.card}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.close} type="button" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.body}>
          {/* LEFT */}
          <div className={styles.left}>
            <div className={styles.header}>
              <div className={styles.title}>{title}</div>
              <div className={styles.sub}>
                {loading
                  ? "Loading..."
                  : action?.createdAt
                  ? new Date(action.createdAt).toLocaleString()
                  : ""}
              </div>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.row}>
              <div className={styles.label}>Actor</div>
              <div className={styles.value}>
                {action?.actor?.username
                  ? `@${action.actor.username}`
                  : action?.actorId
                  ? `#${action.actorId}`
                  : "system"}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.label}>Target</div>
              <div className={styles.value}>
                {action ? `${action.targetType} #${action.targetId}` : "—"}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.label}>Action Type</div>
              <div className={styles.value}>{action?.actionType ?? "—"}</div>
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>Reason</div>
              <div className={styles.reason}>
                {loading ? (
                  <span className={styles.muted}>Loading...</span>
                ) : action?.reason ? (
                  action.reason
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.right}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>Metadata</div>
              <pre className={styles.json}>
                {loading ? "Loading..." : JSON.stringify(action?.metadata ?? null, null, 2)}
              </pre>
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>Evidence</div>
              <pre className={styles.json}>
                {loading ? "Loading..." : JSON.stringify(evidence ?? null, null, 2)}
              </pre>
            </div>

            <div className={styles.footer}>
              <button className={styles.btn} type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
