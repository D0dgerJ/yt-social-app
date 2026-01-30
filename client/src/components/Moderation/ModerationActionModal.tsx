import { useEffect, useMemo, useState } from "react";
import type { ModerationActionItem } from "@/utils/api/mod.api";
import { getModerationActionEvidence } from "@/utils/api/mod.api";
import PostGallery from "@/components/Post/parts/PostGallery";
import PostVideos from "@/components/Post/parts/PostVideos";
import PostFiles from "@/components/Post/parts/PostFiles";
import UserSanctionsPanel from "@/components/Moderation/UserSanctionsPanel";
import styles from "./ModerationActionModal.module.scss";

type PostPreview = {
  id: number;
  userId: number;
  desc: string | null;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string | null;
  status: string;
  createdAt: string;
  user?: { id: number; username: string };
  _count?: { likes: number; comments: number };
};

type UserPreview = {
  id: number;
  username: string;
  email: string;
  role: string;
  isAdmin: boolean;
  desc?: string | null;
  profilePicture?: string | null;
  coverPicture?: string | null;
  from?: string | null;
  city?: string | null;
  relationship?: number | null;
};

type Props = {
  open: boolean;
  actionId: number | null;
  onClose: () => void;
};

function safeStringify(val: any) {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

export default function ModerationActionModal({ open, actionId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ModerationActionItem | null>(null);
  const [targetPost, setTargetPost] = useState<PostPreview | null>(null);
  const [targetUser, setTargetUser] = useState<UserPreview | null>(null);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !actionId) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getModerationActionEvidence(actionId);
        setAction(data.action ?? null);
        setTargetPost(data.targetPost ?? null);
        setTargetUser(data.targetUser ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, actionId]);

  const metaJson = useMemo(() => safeStringify(action?.metadata), [action?.metadata]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div className={styles.card} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.body}>
          <div className={styles.left}>
            <div className={styles.header}>
              <div className={styles.title}>Evidence</div>
              <div className={styles.sub}>
                {loading ? "Loading..." : action ? `#${action.id} · ${new Date(action.createdAt).toLocaleString()}` : "—"}
              </div>
            </div>

            {action ? (
              <>
                <div className={styles.row}>
                  <span className={styles.label}>Actor</span>
                  <span className={styles.value}>
                    {action.actor?.username ? `@${action.actor.username}` : action.actorId ? `#${action.actorId}` : "system"}
                  </span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Action</span>
                  <span className={styles.value}><b>{action.actionType}</b></span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Target</span>
                  <span className={styles.value}>
                    {action.targetType} #{action.targetId}
                  </span>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>Reason</div>
                  <div className={styles.reason}>{action.reason || "—"}</div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>Metadata</div>
                  <pre className={styles.json}>{metaJson || "null"}</pre>
                </div>
              </>
            ) : (
              <div className={styles.muted}>No data</div>
            )}
          </div>

          <div className={styles.right}>
            {targetPost ? (
              <div className={styles.targetCard}>
                <div className={styles.targetTitle}>
                  Post preview <span className={styles.muted}>· status {targetPost.status}</span>
                </div>

                <div className={styles.targetMeta}>
                  <b>@{targetPost.user?.username ?? "unknown"}</b>
                  <span className={styles.muted}>{new Date(targetPost.createdAt).toLocaleString()}</span>
                  <span className={styles.chip}>❤️ {targetPost._count?.likes ?? 0}</span>
                  <span className={styles.chip}>💬 {targetPost._count?.comments ?? 0}</span>
                </div>

                {targetPost.desc ? <div className={styles.postDesc}>{targetPost.desc}</div> : null}
                {targetPost.location ? <div className={styles.muted}>📍 {targetPost.location}</div> : null}

                <div className={styles.media}>
                  <PostGallery images={targetPost.images} gridClassName="post-image-grid" imgClassName="post-image-thumb" showEmpty={false} />
                  <PostVideos videos={targetPost.videos} />
                  <PostFiles files={targetPost.files} />
                </div>
              </div>
            ) : null}

            {targetUser ? (
              <div className={styles.targetCard}>
                <div className={styles.targetTitle}>User</div>

                <div className={styles.userRow}>
                  {targetUser.profilePicture ? (
                    <img className={styles.avatar} src={targetUser.profilePicture} alt="avatar" />
                  ) : (
                    <div className={styles.avatarFallback} />
                  )}
                  <div>
                    <div className={styles.userName}>@{targetUser.username}</div>
                    <div className={styles.muted}>Role: {targetUser.role}</div>
                    <div className={styles.muted}>
                      {targetUser.city ? `City: ${targetUser.city}` : null}
                      {targetUser.from ? ` · From: ${targetUser.from}` : null}
                    </div>
                  </div>
                </div>

                <div className={styles.sanctions}>
                  <UserSanctionsPanel
                    userId={targetUser.id}
                    username={targetUser.username}
                    defaultEvidence={{
                      source: "moderation_history",
                      actionId: action?.id,
                      targetType: action?.targetType,
                      targetId: action?.targetId,
                    }}
                  />
                </div>
              </div>
            ) : null}

            {!targetPost && !targetUser ? (
              <div className={styles.muted}>No target preview for this action.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
