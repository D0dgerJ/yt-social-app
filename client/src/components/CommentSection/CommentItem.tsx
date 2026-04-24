import React, { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { FiMoreHorizontal } from "react-icons/fi";
import type { Comment } from "./types";
import { reportComment } from "../../utils/api/comment.api";
import noProfilePic from "../../assets/profile/user.png";

interface Props {
  comment: Comment;
  currentUserId?: number | null;
  onReply: (parentId: number, content: string) => void;
  onLike: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onUpdate: (commentId: number, newContent: string) => void;
  targetCommentId?: number;
  onStartReply: (commentId: number, username: string) => void;
  depth?: number;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment / bullying" },
  { value: "HATE", label: "Hate speech" },
  { value: "VIOLENCE", label: "Violence / threats" },
  { value: "NUDITY", label: "Nudity / sexual content" },
  { value: "OTHER", label: "Other" },
] as const;

const containsCommentInTree = (
  comment: Comment,
  targetCommentId?: number
): boolean => {
  if (!targetCommentId) return false;
  if (comment.id === targetCommentId) return true;

  return (comment.replies ?? []).some((reply) =>
    containsCommentInTree(reply, targetCommentId)
  );
};

const CommentItem: React.FC<Props> = ({
  comment,
  currentUserId,
  onReply,
  onLike,
  onDelete,
  onUpdate,
  targetCommentId,
  onStartReply,
  depth = 0,
}) => {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] =
    useState<(typeof REPORT_REASONS)[number]["value"]>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const commentRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isAuthed = !!currentUserId;
  const isOwnComment = !!currentUserId && currentUserId === comment.userId;

  const isDeleted =
    comment.status === "DELETED" || comment.content === "(deleted)";
  const isHidden = comment.status === "HIDDEN";
  const isActive =
    !isDeleted &&
    !isHidden &&
    (comment.status ? comment.status === "ACTIVE" : true);

  const isNestedReply = depth > 0;
  const shouldFlattenReplies = depth >= 1;

  const likedByMe = useMemo(() => {
    if (!currentUserId) return false;
    return (comment.likes ?? []).some((l) => l.userId === currentUserId);
  }, [comment.likes, currentUserId]);

  const shouldOpenReplies = useMemo(
    () =>
      (comment.replies?.length ?? 0) > 0 &&
      containsCommentInTree(comment, targetCommentId) &&
      comment.id !== targetCommentId,
    [comment, targetCommentId]
  );

  useEffect(() => {
    if (shouldOpenReplies) {
      setShowReplies(true);
    }
  }, [shouldOpenReplies]);

  useEffect(() => {
    if (comment.id !== targetCommentId) return;

    const timer = window.setTimeout(() => {
      commentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setIsHighlighted(true);
    }, 250);

    const unhighlightTimer = window.setTimeout(() => {
      setIsHighlighted(false);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(unhighlightTimer);
    };
  }, [comment.id, targetCommentId]);

  useEffect(() => {
    if (!menuOpen) return;

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const canInteract = isAuthed && isActive;
  const canEdit = canInteract && isOwnComment;
  const canDelete = isAuthed && isOwnComment;
  const canReply = canInteract;
  const canLike = canInteract;
  const canReport = isAuthed && !isOwnComment;

  const handleUpdate = () => {
    if (!canEdit || !editedContent.trim()) return;
    onUpdate(comment.id, editedContent.trim());
    setEditing(false);
  };

  const formatContent = (text: string) =>
    text.split(" ").map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="post-comment__mention">
            {part}{" "}
          </span>
        );
      }
      if (part.startsWith("#")) {
        return (
          <span key={i} className="post-comment__hashtag">
            {part}{" "}
          </span>
        );
      }
      return part + " ";
    });

  const openReportModal = () => {
    if (!canReport) return;
    setMenuOpen(false);
    setReportError(null);
    setReportSuccess(null);
    setReportReason("SPAM");
    setReportDetails("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!canReport) return;

    setReportLoading(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      await reportComment(comment.id, {
        reason: reportReason,
        details: reportDetails.trim() ? reportDetails.trim() : undefined,
      });

      setReportSuccess("Report submitted");
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(null);
      }, 600);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit report";
      setReportError(msg);
    } finally {
      setReportLoading(false);
    }
  };

  const repliesCount = comment.replies?.length ?? 0;

  return (
    <div
      ref={commentRef}
      className={`post-comment-thread ${
        isNestedReply ? "post-comment-thread--reply" : ""
      } ${shouldFlattenReplies ? "post-comment-thread--flat" : ""}`}
    >
      <div
        className={`post-comment ${isNestedReply ? "post-comment--reply" : ""} ${
          comment.status === "DELETED" ? "post-comment--deleted" : ""
        } ${comment.status === "HIDDEN" ? "post-comment--hidden" : ""}`}
        style={{
          transition: "box-shadow 0.35s ease, background-color 0.35s ease",
          boxShadow: isHighlighted
            ? "0 0 0 2px var(--color-primary), 0 10px 30px rgba(15, 23, 42, 0.16)"
            : undefined,
          backgroundColor: isHighlighted
            ? "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))"
            : undefined,
          borderRadius: isHighlighted ? "16px" : undefined,
        }}
      >
        <img
          src={comment.user.profilePicture || noProfilePic}
          alt={comment.user.username}
          className="post-comment__avatar"
          onError={(e) => {
            e.currentTarget.src = noProfilePic;
          }}
        />

        <div className="post-comment__content">
          <div className="post-comment__header">
            <div className="post-comment__author-block">
              <span className="post-comment__username">
                {comment.user.username}
              </span>
            </div>

            <div className="post-comment__menu" ref={menuRef}>
              <button
                type="button"
                className="post-comment__menu-trigger"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open comment menu"
              >
                <FiMoreHorizontal className="post-comment__more-icon" />
              </button>

              {menuOpen && (
                <div className="post-comment__menu-dropdown">
                  {!isOwnComment && (
                    <button disabled={!canReport} onClick={openReportModal}>
                      Report
                    </button>
                  )}

                  {isOwnComment && (
                    <>
                      <button
                        disabled={!canEdit}
                        onClick={() => setEditing((v) => !v)}
                      >
                        {editing ? "Cancel edit" : "Edit"}
                      </button>
                      <button
                        disabled={!canDelete}
                        onClick={() => onDelete(comment.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={!canEdit}
              className="post-comment__inline-input"
            />
          ) : (
            <div className="post-comment__text">
              {formatContent(comment.content)}
            </div>
          )}

          {!!comment.images?.length && (
            <div className="post-comment__images">
              {comment.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="attachment"
                  className="post-comment__img"
                />
              ))}
            </div>
          )}

          <div className="post-comment__meta">
            <span className="post-comment__time">
              {moment(comment.createdAt).fromNow()}
            </span>

            <button
              type="button"
              className={`post-comment__like-btn ${likedByMe ? "liked" : ""} ${
                !canLike ? "disabled" : ""
              }`}
              onClick={() => canLike && onLike(comment.id)}
              title={!isAuthed ? "Login to like" : !isActive ? "Unavailable" : ""}
              disabled={!canLike}
            >
              ❤️ {comment._count?.likes || 0}
            </button>

            <button
              type="button"
              onClick={() =>
                canReply && onStartReply(comment.id, comment.user.username)
              }
              disabled={!canReply}
            >
              Reply
            </button>
          </div>

          {editing && (
            <div className="post-comment__edit-box">
              <button disabled={!canEdit} onClick={handleUpdate}>
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {!!repliesCount && (
        <div className="post-comment-thread__children">
          {!showReplies && (
            <button
              className="post-comment__view-replies"
              onClick={() => setShowReplies(true)}
            >
              View replies ({repliesCount})
            </button>
          )}

          {showReplies && (
            <>
              <div
                className={`post-comment__replies ${
                  shouldFlattenReplies ? "post-comment__replies--flat" : ""
                }`}
              >
                {(comment.replies ?? []).map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUserId={currentUserId}
                    onReply={onReply}
                    onLike={onLike}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    targetCommentId={targetCommentId}
                    onStartReply={onStartReply}
                    depth={depth + 1}
                  />
                ))}
              </div>

              <button
                className="post-comment__hide-replies"
                onClick={() => setShowReplies(false)}
              >
                Hide replies
              </button>
            </>
          )}
        </div>
      )}

      {reportOpen && (
        <div
          className="post-comment__modal-overlay"
          onClick={() => !reportLoading && setReportOpen(false)}
        >
          <div
            className="post-comment__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="post-comment__modal-header">
              <h3>Report comment</h3>
              <button
                className="post-comment__modal-close"
                disabled={reportLoading}
                onClick={() => setReportOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="post-comment__modal-body">
              <label>
                Reason
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as any)}
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Details (optional)
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Add any additional details…"
                  maxLength={500}
                />
              </label>

              {reportError && (
                <div className="post-comment__modal-error">{reportError}</div>
              )}
              {reportSuccess && (
                <div className="post-comment__modal-success">{reportSuccess}</div>
              )}
            </div>

            <div className="post-comment__modal-footer">
              <button
                disabled={reportLoading}
                onClick={() => setReportOpen(false)}
              >
                Cancel
              </button>
              <button disabled={reportLoading} onClick={submitReport}>
                {reportLoading ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem;