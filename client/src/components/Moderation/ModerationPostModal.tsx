import { useEffect, useState } from "react";
import type { ReportStatus } from "@/utils/api/mod.api";
import { getReportItems } from "@/utils/api/mod.api";
import PostGallery from "@/components/Post/parts/PostGallery";
import PostVideos from "@/components/Post/parts/PostVideos";
import PostFiles from "@/components/Post/parts/PostFiles";

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

  useEffect(() => {
    if (!open) return;

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      try {
        // берём все репорты по этому посту (можно увеличить take)
        const data = await getReportItems({ status, postId, take: 200, skip: 0 });
        setReports(data.items ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, postId, status]);

  if (!open) return null;

  const likeCount =
    post?._count?.likes ??
    (Array.isArray(post?.likes) ? post!.likes!.length : 0);

  const commentsCount = post?._count?.comments ?? 0;

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
                <b>@{post?.user?.username ?? "unknown"}</b>
              </div>
              <div className="mod-post-modal__muted">
                {post?.createdAt ? new Date(post.createdAt).toLocaleString() : ""}
              </div>
              <div className="mod-post-modal__chips">
                <span className="chip">Status: {post?.status ?? "-"}</span>
                <span className="chip">Likes: {likeCount}</span>
                <span className="chip">Comments: {commentsCount}</span>
              </div>
            </div>

            {post?.desc ? <div className="mod-post-modal__desc">{post.desc}</div> : null}

            {post?.location ? (
              <div className="mod-post-modal__muted">📍 {post.location}</div>
            ) : null}

            {/* медиа */}
            <div className="mod-post-modal__media">
              <PostGallery
                images={post?.images}
                gridClassName="post-image-grid"
                imgClassName="post-image-thumb"
                showEmpty={false}
              />
              <PostVideos videos={post?.videos} />
              <PostFiles files={post?.files} />
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
                <div key={r.id} className="mod-post-modal__reportItem">
                  <div className="mod-post-modal__reportTop">
                    <div>
                      <b>{reasonLabel[r.reason] ?? r.reason}</b>{" "}
                      <span className="mod-post-modal__muted">
                        @{r.reporter?.username ?? "unknown"}
                      </span>
                    </div>
                    <div className="mod-post-modal__muted">
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {r.message ? (
                    <div className="mod-post-modal__reportMsg">{r.message}</div>
                  ) : (
                    <div className="mod-post-modal__muted">(без сообщения)</div>
                  )}

                  <div className="mod-post-modal__muted">
                    Status: <b>{r.status}</b>
                    {r.reviewedBy ? (
                      <>
                        {" · "}Reviewed by @{r.reviewedBy.username}
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="mod-post-modal__hint mod-post-modal__muted">
              (Дальше можно добавить кнопки approve/reject прямо на каждый репорт)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
