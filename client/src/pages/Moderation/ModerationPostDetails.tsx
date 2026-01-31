import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import { AuthContext } from "@/context/AuthContext";

import {
  getReportItems,
  getReportById,
  approveReport,
  rejectReport,
  hidePost,
  unhidePost,
  softDeletePost,
  hardDeletePost,
  getModerationActions,
  type ModerationActionItem,
  type ReportStatus,
} from "@/utils/api/mod.api";

import styles from "./ModerationPostDetails.module.scss";

const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);
const ADMIN_PLUS = new Set(["ADMIN", "OWNER"]);

type ModerationPostView = {
  id: number;
  userId: number;
  desc: string | null;
  status: string;
  createdAt: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string | null;
};

type ReportItem = {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  message: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reporter?: { id: number; username: string };
  reviewedBy?: { id: number; username: string };
  post?: ModerationPostView;
};

type FullReport = {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  message: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reporter?: { id: number; username: string };
  reviewedBy?: { id: number; username: string };
  post?: ModerationPostView;
};

type DraftDecision = "VIOLATION" | "NO_VIOLATION" | "";

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

function fmt(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function clip(text?: string | null, max = 220) {
  const t = (text ?? "").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function extractApiError(e: any): { message: string; details?: any } {
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    "Request failed";

  const details = e?.response?.data?.details;
  return { message: String(msg), details };
}

export default function ModerationPostDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const postId = Number(params.postId);

  const role = (user as any)?.role as string | undefined;
  const isAdminPlus = Boolean(role && ADMIN_PLUS.has(role));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  const [activeFullReport, setActiveFullReport] = useState<FullReport | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  // --- Decision draft (Block 4) ---
  const [draftDecision, setDraftDecision] = useState<DraftDecision>("");
  const [draftCategory, setDraftCategory] = useState<string>("other");
  const [draftNote, setDraftNote] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string>("");

  // --- Block 5: Post actions ---
  const [actionNote, setActionNote] = useState<string>("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string>("");
  const [alreadyHandled, setAlreadyHandled] = useState<{
    actionType: string;
    actor?: { id?: number; username?: string } | null;
    at?: string | null;
    reason?: string | null;
    message?: string | null;
  } | null>(null);

  const [modActions, setModActions] = useState<ModerationActionItem[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  // --- access guard ---
  useEffect(() => {
    if (!user || !role || !ALLOWED.has(role)) navigate("/");
  }, [user, role, navigate]);

  // --- load reports (PENDING + APPROVED + REJECTED) ---
  useEffect(() => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setError("Invalid postId in URL");
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      setError("");

      try {
        const [pending, approved, rejected] = await Promise.all([
          getReportItems({ postId, status: "PENDING", take: 200, skip: 0 }),
          getReportItems({ postId, status: "APPROVED", take: 200, skip: 0 }),
          getReportItems({ postId, status: "REJECTED", take: 200, skip: 0 }),
        ]);

        const all: ReportItem[] = [
          ...(pending?.items ?? []),
          ...(approved?.items ?? []),
          ...(rejected?.items ?? []),
        ];

        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (cancelled) return;

        setReports(all);

        const newestPending = all.find((r) => r.status === "PENDING");
        const fallback = all[0];

        const nextActive = newestPending?.id ?? fallback?.id ?? null;
        setActiveReportId(nextActive);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load reports");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  // --- load active report with full post (images/videos/files etc.) ---
  useEffect(() => {
    if (activeReportId === null) {
      setActiveFullReport(null);
      return;
    }

    let cancelled = false;

    async function loadOne(reportId: number) {
      setIsLoadingActive(true);
      try {
        const res = await getReportById(reportId);
        const report = res?.report as FullReport | undefined;
        if (!cancelled) setActiveFullReport(report ?? null);
      } catch {
        if (!cancelled) setActiveFullReport(null);
      } finally {
        if (!cancelled) setIsLoadingActive(false);
      }
    }

    void loadOne(activeReportId);

    return () => {
      cancelled = true;
    };
  }, [activeReportId]);

  // --- load moderation actions for this post (for "already handled") ---
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

        setModActions(items);

        const last =
          items.find((a) => a.actionType === "CONTENT_DELETED") ||
          items.find((a) => a.actionType === "CONTENT_HIDDEN") ||
          items.find((a) => a.actionType === "CONTENT_UNHIDDEN") ||
          null;

        if (last) {
          setAlreadyHandled({
            actionType: last.actionType,
            actor: last.actor ?? null,
            at: last.createdAt,
            reason: last.reason ?? null,
            message: null,
          });
        } else {
          setAlreadyHandled(null);
        }
      } catch {
        if (!cancelled) setModActions([]);
      } finally {
        if (!cancelled) setIsLoadingActions(false);
      }
    }

    void loadActions();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const counts = useMemo(() => {
    const out = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const r of reports) out[r.status] += 1;
    return out;
  }, [reports]);

  const activeLite = useMemo(
    () => reports.find((r) => r.id === activeReportId) ?? null,
    [reports, activeReportId]
  );

  const post: ModerationPostView | null =
    activeFullReport?.post ?? activeLite?.post ?? null;

  const images: string[] = post?.images ?? [];
  const videos: string[] = post?.videos ?? [];
  const files: string[] = post?.files ?? [];
  const tags: string[] = post?.tags ?? [];
  const location: string | null = post?.location ?? null;

  // --- Decision gating ---
  const isPendingActive = activeLite?.status === "PENDING";

  const noteTrimmed = draftNote.trim();
  const isNoteValid = noteTrimmed.length >= 10;

  const canApprove =
    isPendingActive &&
    draftDecision === "VIOLATION" &&
    Boolean(draftCategory) &&
    isNoteValid &&
    !isSubmittingDecision;

  const canReject =
    isPendingActive &&
    draftDecision === "NO_VIOLATION" &&
    isNoteValid &&
    !isSubmittingDecision;

  const decisionHint = !isPendingActive
    ? "This report is already reviewed."
    : draftDecision === "VIOLATION" && !draftCategory
    ? "Select category."
    : !isNoteValid
    ? "Write a short moderator note (min 10 chars)."
    : "";

  const hasApprovedReport = counts.APPROVED > 0;

  const actionNoteTrimmed = actionNote.trim();
  const isActionNoteValid = actionNoteTrimmed.length >= 10;

  // Determine current state from moderation actions (best-effort)
  const lastState = useMemo(() => {
    const sorted = [...modActions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const lastDelete = sorted.find((a) => a.actionType === "CONTENT_DELETED");
    if (lastDelete) return "DELETED";

    const lastHide = sorted.find((a) => a.actionType === "CONTENT_HIDDEN");
    const lastUnhide = sorted.find((a) => a.actionType === "CONTENT_UNHIDDEN");

    if (
      lastHide &&
      (!lastUnhide || new Date(lastHide.createdAt) > new Date(lastUnhide.createdAt))
    ) {
      return "HIDDEN";
    }

    return "ACTIVE";
  }, [modActions]);

  const canUsePostActions = hasApprovedReport && !isSubmittingAction;
  const canHide = canUsePostActions && lastState === "ACTIVE" && isActionNoteValid;
  const canUnhide = canUsePostActions && lastState === "HIDDEN" && isActionNoteValid;
  const canSoftDelete =
    canUsePostActions && lastState !== "DELETED" && isActionNoteValid && isAdminPlus;
  const canHardDelete =
    canUsePostActions && lastState !== "DELETED" && isActionNoteValid && isAdminPlus;

  async function refreshCase() {
    const [pending, approved, rejected] = await Promise.all([
      getReportItems({ postId, status: "PENDING", take: 200, skip: 0 }),
      getReportItems({ postId, status: "APPROVED", take: 200, skip: 0 }),
      getReportItems({ postId, status: "REJECTED", take: 200, skip: 0 }),
    ]);

    const all: ReportItem[] = [
      ...(pending?.items ?? []),
      ...(approved?.items ?? []),
      ...(rejected?.items ?? []),
    ];

    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setReports(all);

    const stillExists =
      activeReportId !== null && all.some((r) => r.id === activeReportId);
    if (!stillExists) {
      const newestPending = all.find((r) => r.status === "PENDING");
      setActiveReportId(newestPending?.id ?? all[0]?.id ?? null);
    }
  }

  async function refreshActions() {
    setIsLoadingActions(true);
    try {
      const res = await getModerationActions({
        targetType: "POST",
        targetId: String(postId),
        take: 50,
        skip: 0,
      });

      const items: ModerationActionItem[] = res?.items ?? res?.actions ?? [];
      setModActions(items);

      const last =
        items.find((a) => a.actionType === "CONTENT_DELETED") ||
        items.find((a) => a.actionType === "CONTENT_HIDDEN") ||
        items.find((a) => a.actionType === "CONTENT_UNHIDDEN") ||
        null;

      if (last) {
        setAlreadyHandled({
          actionType: last.actionType,
          actor: last.actor ?? null,
          at: last.createdAt,
          reason: last.reason ?? null,
          message: null,
        });
      } else {
        setAlreadyHandled(null);
      }
    } finally {
      setIsLoadingActions(false);
    }
  }

  async function handleApprove() {
    if (!activeLite) return;

    setDecisionError("");
    setIsSubmittingDecision(true);

    try {
      const reason = `Approved: ${draftCategory}`;
      const message = noteTrimmed;

      await approveReport(activeLite.id, { reason, message });

      setDraftDecision("");
      setDraftNote("");
      setDraftCategory("other");

      await refreshCase();
      await refreshActions();
    } catch (e: any) {
      setDecisionError(e?.message || "Failed to approve report");
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  async function handleReject() {
    if (!activeLite) return;

    setDecisionError("");
    setIsSubmittingDecision(true);

    try {
      const reason = "Rejected: no violation";
      const message = noteTrimmed;

      await rejectReport(activeLite.id, { reason, message });

      setDraftDecision("");
      setDraftNote("");
      setDraftCategory("other");

      await refreshCase();
      await refreshActions();
    } catch (e: any) {
      setDecisionError(e?.message || "Failed to reject report");
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  async function handlePostAction(fn: "hide" | "unhide" | "soft" | "hard") {
    setActionError("");
    setIsSubmittingAction(true);

    try {
      if (fn === "hide") await hidePost(postId, actionNoteTrimmed);
      if (fn === "unhide") await unhidePost(postId, actionNoteTrimmed);
      if (fn === "soft") await softDeletePost(postId, actionNoteTrimmed);
      if (fn === "hard") await hardDeletePost(postId, actionNoteTrimmed);

      setActionNote("");
      await refreshActions();

      if (activeReportId !== null) {
        try {
          const res = await getReportById(activeReportId);
          const report = res?.report as FullReport | undefined;
          setActiveFullReport(report ?? null);
        } catch {
          // ignore
        }
      }
    } catch (e: any) {
      const parsed = extractApiError(e);

      if (e?.response?.status === 409 && parsed.details?.already) {
        const a = parsed.details.already;
        setAlreadyHandled({
          actionType: a.actionType ?? "CONFLICT",
          actor: a.actor ?? null,
          at: a.at ?? null,
          reason: a.reason ?? null,
          message: a.message ?? null,
        });
      }

      setActionError(parsed.message);
      await refreshActions();
    } finally {
      setIsSubmittingAction(false);
    }
  }

  const postActionsHint = !hasApprovedReport
    ? "Post actions доступны только после APPROVED report."
    : !isActionNoteValid
    ? "Action note обязателен (min 10 chars)."
    : !isAdminPlus
    ? "Soft/Hard delete доступны только ADMIN/OWNER."
    : "";

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <Sidebar />

        <div className={styles.main}>
          <div className={styles.header}>
            <div className={styles.left}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => navigate("/moderation")}
              >
                ← Back to list
              </button>

              <h2 className={styles.title}>
                Case: Post <span className={styles.mono}>#{postId}</span>
              </h2>
            </div>

            <button
              type="button"
              className={styles.historyBtn}
              onClick={() => navigate("/moderation/history")}
            >
              Open history
            </button>
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          {alreadyHandled ? (
            <div className={styles.handledBanner}>
              <div className={styles.handledTitle}>Already handled</div>

              <div className={styles.handledRow}>
                <span className={styles.metaKey}>Action:</span>
                <span className={styles.metaVal}>{alreadyHandled.actionType}</span>
              </div>

              <div className={styles.handledRow}>
                <span className={styles.metaKey}>By:</span>
                <span className={styles.metaVal}>
                  @{alreadyHandled.actor?.username ?? "unknown"}{" "}
                  {alreadyHandled.actor?.id ? (
                    <span className={styles.mutedSmall}>(#{alreadyHandled.actor.id})</span>
                  ) : null}
                </span>
              </div>

              <div className={styles.handledRow}>
                <span className={styles.metaKey}>When:</span>
                <span className={styles.metaVal}>{fmt(alreadyHandled.at)}</span>
              </div>

              {alreadyHandled.reason ? (
                <div className={styles.handledRow}>
                  <span className={styles.metaKey}>Reason:</span>
                  <span className={styles.metaVal}>{alreadyHandled.reason}</span>
                </div>
              ) : null}

              {alreadyHandled.message ? (
                <div className={styles.handledMsg}>{alreadyHandled.message}</div>
              ) : null}
            </div>
          ) : null}

          <div className={styles.topStats}>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Pending</div>
              <div className={styles.statValue}>{counts.PENDING}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Approved</div>
              <div className={styles.statValue}>{counts.APPROVED}</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Rejected</div>
              <div className={styles.statValue}>{counts.REJECTED}</div>
            </div>
          </div>

          <div className={styles.grid}>
            {/* LEFT: Post preview */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Post preview</h3>

              {isLoading || isLoadingActive ? (
                <div className={styles.muted}>Loading…</div>
              ) : !post ? (
                <div className={styles.muted}>No post data yet (select a report).</div>
              ) : (
                <>
                  <div className={styles.postMeta}>
                    <div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaKey}>Status:</span>
                        <span className={styles.metaVal}>{post.status}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaKey}>Created:</span>
                        <span className={styles.metaVal}>{fmt(post.createdAt)}</span>
                      </div>
                      {location ? (
                        <div className={styles.metaRow}>
                          <span className={styles.metaKey}>Location:</span>
                          <span className={styles.metaVal}>{location}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.metaRight}>
                      {tags.length ? (
                        <div className={styles.tags}>
                          {tags.slice(0, 8).map((t) => (
                            <span key={t} className={styles.tag}>
                              #{t}
                            </span>
                          ))}
                          {tags.length > 8 ? (
                            <span className={styles.tagMuted}>+{tags.length - 8}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className={styles.mutedSmall}>No tags</div>
                      )}
                    </div>
                  </div>

                  {post.desc ? (
                    <div className={styles.postText}>{post.desc}</div>
                  ) : (
                    <div className={styles.muted}>(no text)</div>
                  )}

                  {images.length || videos.length || files.length ? (
                    <div className={styles.mediaBlock}>
                      {images.length ? (
                        <div className={styles.mediaRow}>
                          <div className={styles.mediaTitle}>Images</div>
                          <div className={styles.mediaGrid}>
                            {images.slice(0, 6).map((src, idx) => (
                              <img
                                key={`${src}-${idx}`}
                                src={src}
                                alt="post img"
                                className={styles.mediaImg}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {videos.length ? (
                        <div className={styles.mediaRow}>
                          <div className={styles.mediaTitle}>Videos</div>
                          <div className={styles.mediaList}>
                            {videos.slice(0, 5).map((v, idx) => (
                              <div key={`${v}-${idx}`} className={styles.mediaItem}>
                                🎬 {v}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {files.length ? (
                        <div className={styles.mediaRow}>
                          <div className={styles.mediaTitle}>Files</div>
                          <div className={styles.mediaList}>
                            {files.slice(0, 8).map((f, idx) => (
                              <div key={`${f}-${idx}`} className={styles.mediaItem}>
                                📎 {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className={styles.mutedSmall}>No media</div>
                  )}
                </>
              )}
            </section>

            {/* RIGHT: Reports list + details */}
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Reports</h3>

              {isLoading ? (
                <div className={styles.muted}>Loading reports…</div>
              ) : reports.length === 0 ? (
                <div className={styles.muted}>No reports for this post.</div>
              ) : (
                <div className={styles.reportsWrap}>
                  <div className={styles.reportsList}>
                    {reports.map((r) => {
                      const isActive = r.id === activeReportId;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={isActive ? styles.reportItemActive : styles.reportItem}
                          onClick={() => setActiveReportId(r.id)}
                        >
                          <div className={styles.reportTop}>
                            <div className={styles.reportReason}>
                              {reasonLabel[r.reason] ?? r.reason}
                            </div>
                            <div className={styles.reportStatus}>{r.status}</div>
                          </div>

                          <div className={styles.reportBy}>
                            @{r.reporter?.username ?? "unknown"} · {fmt(r.createdAt)}
                          </div>

                          <div className={styles.reportMsg}>
                            {r.message ? clip(r.message, 120) : "(no message)"}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.reportDetails}>
                    <div className={styles.detailsTitle}>Report details</div>

                    {!activeLite ? (
                      <div className={styles.muted}>Select a report to view details.</div>
                    ) : (
                      <>
                        <div className={styles.detailsRow}>
                          <span className={styles.metaKey}>Report ID:</span>
                          <span className={styles.mono}>#{activeLite.id}</span>
                        </div>

                        <div className={styles.detailsRow}>
                          <span className={styles.metaKey}>Status:</span>
                          <span className={styles.metaVal}>{activeLite.status}</span>
                        </div>

                        <div className={styles.detailsRow}>
                          <span className={styles.metaKey}>Reporter:</span>
                          <span className={styles.metaVal}>
                            @{activeLite.reporter?.username ?? "unknown"}
                          </span>
                        </div>

                        <div className={styles.detailsRow}>
                          <span className={styles.metaKey}>Created:</span>
                          <span className={styles.metaVal}>{fmt(activeLite.createdAt)}</span>
                        </div>

                        {activeLite.reviewedBy ? (
                          <div className={styles.detailsRow}>
                            <span className={styles.metaKey}>Reviewed by:</span>
                            <span className={styles.metaVal}>
                              @{activeLite.reviewedBy.username} · {fmt(activeLite.reviewedAt)}
                            </span>
                          </div>
                        ) : null}

                        <div className={styles.detailsMsg}>
                          {activeLite.message ? activeLite.message : "(no message)"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Block 4 + Block 5 */}
          <div className={styles.nextBlocks}>
            {/* Block 4 */}
            <div
              className={`${styles.nextCard} ${!isPendingActive ? styles.cardDisabled : ""}`}
            >
              <div className={styles.nextTitle}>Decision draft</div>

              {decisionError ? <div className={styles.decisionError}>{decisionError}</div> : null}

              <div className={styles.formRow}>
                <div className={styles.label}>Decision *</div>
                <div className={styles.radioRow}>
                  <label className={styles.radio}>
                    <input
                      type="radio"
                      name="decision"
                      value="VIOLATION"
                      checked={draftDecision === "VIOLATION"}
                      onChange={() => setDraftDecision("VIOLATION")}
                      disabled={!isPendingActive || isSubmittingDecision}
                    />
                    <span>Policy violation (Approve report)</span>
                  </label>

                  <label className={styles.radio}>
                    <input
                      type="radio"
                      name="decision"
                      value="NO_VIOLATION"
                      checked={draftDecision === "NO_VIOLATION"}
                      onChange={() => setDraftDecision("NO_VIOLATION")}
                      disabled={!isPendingActive || isSubmittingDecision}
                    />
                    <span>No violation (Reject report)</span>
                  </label>
                </div>
              </div>

              {draftDecision === "VIOLATION" ? (
                <div className={styles.formRow}>
                  <div className={styles.label}>Category *</div>
                  <select
                    className={styles.select}
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    disabled={!isPendingActive || isSubmittingDecision}
                  >
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment / hate speech</option>
                    <option value="violence">Violence / threats</option>
                    <option value="nudity">Nudity / sexual content</option>
                    <option value="copyright">Copyright violation</option>
                    <option value="other">Other policy violation</option>
                  </select>
                </div>
              ) : null}

              <div className={styles.formRow}>
                <div className={styles.label}>Moderator note *</div>
                <textarea
                  className={styles.textarea}
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Explain your decision (why approve/reject). This will be logged in moderation history."
                  disabled={!isPendingActive || isSubmittingDecision}
                  rows={5}
                />
                <div className={styles.help}>
                  Min 10 characters. Current: {noteTrimmed.length}
                </div>
              </div>

              {decisionHint ? <div className={styles.hint}>{decisionHint}</div> : null}

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={`${styles.approveBtn} ${canApprove ? styles.btnActive : ""}`}
                  disabled={!canApprove}
                  onClick={handleApprove}
                  title={
                    canApprove
                      ? "Approve report"
                      : "Fill decision + category + note, and make sure report is PENDING"
                  }
                >
                  {isSubmittingDecision ? "Working…" : "Approve report"}
                </button>

                <button
                  type="button"
                  className={`${styles.rejectBtn} ${canReject ? styles.btnDangerActive : ""}`}
                  disabled={!canReject}
                  onClick={handleReject}
                  title={
                    canReject
                      ? "Reject report"
                      : "Fill decision + note, and make sure report is PENDING"
                  }
                >
                  {isSubmittingDecision ? "Working…" : "Reject report"}
                </button>
              </div>

              <div className={styles.mutedSmall}>
                Сначала выбери решение и напиши обоснование — только после этого кнопки станут активны.
              </div>
            </div>

            {/* Block 5 */}
            <div
              className={`${styles.nextCard} ${!hasApprovedReport ? styles.cardDisabled : ""}`}
            >
              <div className={styles.nextTitle}>Post actions</div>

              <div className={styles.mutedSmall}>
                State: <b>{lastState}</b>{" "}
                {isLoadingActions ? (
                  <span className={styles.mutedSmall}>(loading actions…)</span>
                ) : null}
              </div>

              {actionError ? <div className={styles.actionError}>{actionError}</div> : null}

              <div className={styles.formRow}>
                <div className={styles.label}>Action note *</div>
                <textarea
                  className={styles.textarea}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Explain why you apply this post action. Required."
                  disabled={!hasApprovedReport || isSubmittingAction}
                  rows={4}
                />
                <div className={styles.help}>
                  Min 10 characters. Current: {actionNoteTrimmed.length}
                </div>
              </div>

              {postActionsHint ? <div className={styles.hint}>{postActionsHint}</div> : null}

              <div className={styles.postActionsRow}>
                <button
                  type="button"
                  className={`${styles.postBtn} ${canHide ? styles.btnActive : ""}`}
                  disabled={!canHide}
                  onClick={() => handlePostAction("hide")}
                  title="Hide post (temporary)"
                >
                  {isSubmittingAction ? "Working…" : "Hide (temporary)"}
                </button>

                <button
                  type="button"
                  className={`${styles.postBtn} ${canUnhide ? styles.btnActive : ""}`}
                  disabled={!canUnhide}
                  onClick={() => handlePostAction("unhide")}
                  title="Unhide post (restore visibility)"
                >
                  {isSubmittingAction ? "Working…" : "Unhide"}
                </button>
              </div>

              <div className={styles.postActionsRow}>
                <button
                  type="button"
                  className={`${styles.postBtnDanger} ${canSoftDelete ? styles.btnDangerActive : ""}`}
                  disabled={!canSoftDelete}
                  onClick={() => handlePostAction("soft")}
                  title="Soft delete (recoverable)"
                >
                  {isSubmittingAction ? "Working…" : "Soft delete"}
                </button>

                <button
                  type="button"
                  className={`${styles.postBtnDanger} ${canHardDelete ? styles.btnDangerActive : ""}`}
                  disabled={!canHardDelete}
                  onClick={() => handlePostAction("hard")}
                  title="Hard delete (permanent)"
                >
                  {isSubmittingAction ? "Working…" : "Hard delete"}
                </button>
              </div>

              {!isAdminPlus ? (
                <div className={styles.mutedSmall}>
                  Soft/Hard delete требуют роль ADMIN/OWNER.
                </div>
              ) : null}

              <button
                type="button"
                className={styles.refreshBtn}
                onClick={() => void refreshActions()}
              >
                Refresh actions
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}