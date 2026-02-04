import { useEffect, useState } from "react";
import type { ReportStatus } from "@/utils/api/mod.api";
import { getReportItems } from "@/utils/api/mod.api";
import PostGallery from "@/components/Post/parts/PostGallery";
import PostVideos from "@/components/Post/parts/PostVideos";
import PostFiles from "@/components/Post/parts/PostFiles";
import UserSanctionsPanel from "../../Panels/UserSanctionsPanel/UserSanctionsPanel";
import PostModerationActions from "../../List/PostModerationActions/PostModerationActions";
import ReportItemCard from "../../List/ReportItemCard/ReportItemCard";

type ReportItem = {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  reporter?: { id: number; username: string };
  reviewedBy?: { id: number; username: string };
};

type PostFull = {
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
  likes?: Array<{ userId: number }>;
  _count?: { likes?: number; comments?: number };
};

type Props = {
  open: boolean;
  onClose: () => void;
  postId: number;
  status: ReportStatus;
  post: PostFull | null;
};

const reasonLabel: Record<string, string> = {
  spam: "Спам",
  abuse: "Оскорбления",
  harassment: "Травля",
  hate: "Ненависть",
  violence: "Насилие",
  nudity: "Нагота",
  scam: "Мошенничество",
  other: "Другое",
};

export default function ModerationPostModal({ open, onClose, postId, status, post }: Props) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [postState, setPostState] = useState<PostFull | null>(post);

  // чтобы блокировать конкретный репорт при клике approve/reject
  const [busyReportId, setBusyReportId] = useState<number | null>(null);

  useEffect(() => {
    setPostState(post);
  }, [post]);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getReportItems({ status, postId, take: 200, skip: 0 });
      setReports(data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId, status]);

  if (!open) return null;

  const likeCount =
    postState?._count?.likes ?? (Array.isArray(postState?.likes) ? postState!.likes!.length : 0);

  const commentsCount = postState?._count?.comments ?? 0;

  const authorId = postState?.user?.id ?? postState?.userId ?? null;
  const authorUsername = postState?.user?.username ?? undefined;

  const hasApprovedReport = reports.some((r) => r.status === "APPROVED");

  return (
    <div className="mod-post-modal__backdrop" onMouseDown={onClose}>
      <div
        className="mod-post-modal__card"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="mod-post-modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="mod-post-modal__body">
          {/* LEFT: POST */}
          <div className="mod-post-modal__left">
            <div className="mod-post-modal__postHeader">
              <div>
                <b>@{postState?.user?.username ?? "unknown"}</b>
              </div>

              <div className="mod-post-modal__muted">
                {postState?.createdAt ? new Date(postState.createdAt).toLocaleString() : ""}
              </div>

              <div className="mod-post-modal__chips">
                <span className="chip">Status: {postState?.status ?? "-"}</span>
                <span className="chip">Likes: {likeCount}</span>
                <span className="chip">Comments: {commentsCount}</span>
                <span className="chip">Reports: {reports.length}</span>
              </div>
            </div>

            <PostModerationActions
              postId={postId}
              postStatus={postState?.status}
              hasApprovedReport={hasApprovedReport}
              onPostStatusChange={(next) => setPostState((p) => (p ? { ...p, status: next } : p))}
              onAfterAction={loadReports}
            />

            {postState?.desc ? <div className="mod-post-modal__desc">{postState.desc}</div> : null}

            {postState?.location ? (
              <div className="mod-post-modal__muted">📍 {postState.location}</div>
            ) : null}

            <div className="mod-post-modal__media">
              <PostGallery
                images={postState?.images}
                gridClassName="post-image-grid"
                imgClassName="post-image-thumb"
                showEmpty={false}
              />
              <PostVideos videos={postState?.videos} />
              <PostFiles files={postState?.files} />
            </div>
          </div>

          {/* RIGHT: REPORTS */}
          <div className="mod-post-modal__right">
            <div className="mod-post-modal__rightHeader">
              <b>Reports</b>
              <span className="mod-post-modal__muted">{loading ? "Loading..." : `${reports.length}`}</span>
            </div>

            <div className="mod-post-modal__reportsList">
              {!loading && reports.length === 0 && (
                <div className="mod-post-modal__muted">Нет репортов</div>
              )}

              {reports.map((r) => (
                <ReportItemCard
                  key={r.id}
                  item={r}
                  reasonLabel={reasonLabel}
                  busy={busyReportId === r.id}
                  onBusyChange={setBusyReportId}
                  onAfterAction={loadReports}
                />
              ))}
            </div>

            {authorId ? (
              <div className="mod-post-modal__sanctions">
                <UserSanctionsPanel
                  userId={authorId}
                  username={authorUsername}
                  defaultEvidence={{
                    source: "moderation_post_modal",
                    postId: postState?.id,
                    reportIds: (reports || []).map((x) => x.id),
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
