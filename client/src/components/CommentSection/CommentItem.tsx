import React, { useMemo, useState } from "react";
import moment from "moment";
import { FiMoreHorizontal } from "react-icons/fi";
import { IoMdSend } from "react-icons/io";
import type { Comment } from "./types";
import { reportComment } from "../../utils/api/comment.api";

interface Props {
  comment: Comment;
  currentUserId?: number | null;

  onReply: (parentId: number, content: string) => void;
  onLike: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onUpdate: (commentId: number, newContent: string) => void;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment / bullying" },
  { value: "HATE", label: "Hate speech" },
  { value: "VIOLENCE", label: "Violence / threats" },
  { value: "NUDITY", label: "Nudity / sexual content" },
  { value: "OTHER", label: "Other" },
] as const;

const CommentItem: React.FC<Props> = ({ comment, currentUserId, onReply, onLike, onDelete, onUpdate }) => {
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<(typeof REPORT_REASONS)[number]["value"]>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const isAuthed = !!currentUserId;
  const isOwnComment = !!currentUserId && currentUserId === comment.userId;

  // если бэк вернул status — используем, иначе фоллбек по контенту
  const isDeleted = comment.status === "DELETED" || comment.content === "(deleted)";
  const isHidden = comment.status === "HIDDEN";
  const isActive = !isDeleted && !isHidden && (comment.status ? comment.status === "ACTIVE" : true);

  const likedByMe = useMemo(() => {
    if (!currentUserId) return false;
    return (comment.likes ?? []).some((l) => l.userId === currentUserId);
  }, [comment.likes, currentUserId]);

  const canInteract = isAuthed && isActive;
  const canEdit = canInteract && isOwnComment;
  const canDelete = isAuthed && isOwnComment;
  const canReply = canInteract;
  const canLike = canInteract;

  const canReport = useMemo(() => {
    // нельзя репортить свой коммент + нужно быть залогиненым
    return isAuthed && !isOwnComment;
  }, [isAuthed, isOwnComment]);

  const handleReply = () => {
    if (!canReply) return;
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplying(false);
  };

  const handleUpdate = () => {
    if (!canEdit) return;
    if (!editedContent.trim()) return;
    onUpdate(comment.id, editedContent.trim());
    setEditing(false);
  };

  const formatContent = (text: string) =>
    text.split(" ").map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="mention">
            {part}{" "}
          </span>
        );
      }
      if (part.startsWith("#")) {
        return (
          <span key={i} className="hashtag">
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

  return (
    <div
      className={`comment-item
        ${comment.parentId ? "reply-item" : ""}
        ${comment.status === "DELETED" ? "deleted" : ""}
        ${comment.status === "HIDDEN" ? "hidden" : ""} `}>
      <img src={comment.user.profilePicture || "/default-avatar.png"} alt="user" className="avatar" />

      <div className="comment-content">
        <div className="comment-header">
          <span className="username">{comment.user.username}</span>

          {editing ? (
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={!canEdit}
            />
          ) : (
            <span className="text">{formatContent(comment.content)}</span>
          )}

          <div className="comment-menu">
            <FiMoreHorizontal className="more-icon" onClick={() => setMenuOpen((v) => !v)} />

            {menuOpen && (
              <div className="comment-menu-dropdown">
                {!isOwnComment && (
                  <button disabled={!canReport} onClick={openReportModal}>
                    Report
                  </button>
                )}

                {isOwnComment && (
                  <>
                    <button disabled={!canEdit} onClick={() => setEditing((v) => !v)}>
                      {editing ? "Cancel edit" : "Edit"}
                    </button>
                    <button disabled={!canDelete} onClick={() => onDelete(comment.id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {comment.images?.length ? (
          <div className="comment-images">
            {comment.images.map((img, idx) => (
              <img key={idx} src={img} alt="attachment" className="comment-img" />
            ))}
          </div>
        ) : null}

        <div className="comment-meta">
          <span className="time">{moment(comment.createdAt).fromNow()}</span>

          <span
            className={`like-btn ${likedByMe ? "liked" : ""} ${!canLike ? "disabled" : ""}`}
            onClick={() => canLike && onLike(comment.id)}
            title={!isAuthed ? "Login to like" : !isActive ? "Unavailable" : ""}
          >
            ❤️ {comment._count?.likes || 0}
          </span>

          {canReply && (
            <button onClick={() => setReplying(!replying)} disabled={!canReply}>
              Reply
            </button>
          )}

          {!canReply && <button disabled>Reply</button>}
        </div>

        {editing && (
          <div className="edit-box">
            <button disabled={!canEdit} onClick={handleUpdate}>
              Save
            </button>
          </div>
        )}

        {replying && (
          <div className="reply-box">
            <input
              type="text"
              placeholder={isAuthed ? "Write a reply..." : "Login to reply"}
              value={replyText}
              disabled={!canReply}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReply();
              }}
            />
            <button onClick={handleReply} disabled={!canReply}>
              <IoMdSend size={18} />
            </button>
          </div>
        )}

        {comment.replies?.length ? (
          <>
            {!showReplies && (
              <button className="view-replies" onClick={() => setShowReplies(true)}>
                View replies ({comment.replies.length})
              </button>
            )}

            {showReplies && (
              <>
                <div className="replies">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      onLike={onLike}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>

                <button className="hide-replies" onClick={() => setShowReplies(false)}>
                  Hide replies
                </button>
              </>
            )}
          </>
        ) : null}
      </div>

      {/* -------- Report Modal -------- */}
      {reportOpen && (
        <div className="modal-overlay" onClick={() => !reportLoading && setReportOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report comment</h3>
              <button className="modal-close" disabled={reportLoading} onClick={() => setReportOpen(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <label>
                Reason
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value as any)}>
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

              {reportError && <div className="modal-error">{reportError}</div>}
              {reportSuccess && <div className="modal-success">{reportSuccess}</div>}
            </div>

            <div className="modal-footer">
              <button disabled={reportLoading} onClick={() => setReportOpen(false)}>
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