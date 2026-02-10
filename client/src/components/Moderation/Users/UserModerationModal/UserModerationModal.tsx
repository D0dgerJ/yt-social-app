import { useEffect, useId, useRef, useState } from "react";
import styles from "./UserModerationModal.module.scss";
import { getModerationUserById } from "@/utils/api/mod.api";
import type { ModerationUserDetails } from "@/utils/types/moderation/moderationUsers.types";

import UserSanctionsPanel from "@/components/Moderation/Panels/UserSanctionsPanel/UserSanctionsPanel";

type Props = {
  userId: number;
  onClose: () => void;
};

export default function UserModerationModal({ userId, onClose }: Props) {
  const [data, setData] = useState<ModerationUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const titleId = useId();
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Scroll lock with restore
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Focus the dialog on mount for a11y
  useEffect(() => {
    // small delay to ensure element exists in DOM
    const id = window.setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    getModerationUserById(userId)
      .then((res) => {
        if (!isMounted) return;

        setData({
          user: res.user,
          activeSanctions: res.activeSanctions,
          recentSanctions: res.recentSanctions,
          sanctionsSummary: res.sanctionsSummary,
          recentActions: res.recentActions,
        });
      })
      .catch((e) => {
        if (!isMounted) return;
        setError(typeof e?.message === "string" ? e.message : "Failed to load user");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : error || !data ? (
          <>
            <div className={styles.error}>Error: {error || "Failed to load user"}</div>
            <button className={styles.closeBtn} type="button" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.userBlock}>
                <div id={titleId} className={styles.username}>
                  {data.user.username}
                </div>
                <div className={styles.meta}>
                  #{data.user.id} · {data.user.email}
                </div>
              </div>

              <button className={styles.closeIcon} type="button" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>

            <div className={styles.summary}>
              <div>
                Total sanctions: <b>{data.sanctionsSummary.total}</b>
              </div>
              <div>
                Active: <b>{data.sanctionsSummary.active}</b>
              </div>
              <div>
                Status:{" "}
                <b>
                  {data.sanctionsSummary.isBanned
                    ? "BANNED"
                    : data.sanctionsSummary.isRestricted
                      ? "RESTRICTED"
                      : "OK"}
                </b>
              </div>
            </div>

            <div className={styles.panel}>
              <UserSanctionsPanel userId={data.user.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
