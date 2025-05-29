import React, { useState } from "react";
import moment from "moment";
import { FiMoreHorizontal } from "react-icons/fi";
import { IoMdSend } from "react-icons/io";
import { Comment } from "./types";

interface Props {
  comment: Comment;
  currentUserId: number;
  onReply: (parentId: number, content: string) => void;
  onLike: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onUpdate: (commentId: number, newContent: string) => void;
}

const CommentItem: React.FC<Props> = ({
  comment,
  currentUserId,
  onReply,
  onLike,
  onDelete,
  onUpdate,
}) => {
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplying(false);
  };

  const handleUpdate = () => {
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

  return (
    <div className={`comment-item ${comment.parentId ? "reply-item" : ""}`}>
      <img
        src={comment.user.profilePicture || "/default-avatar.png"}
        alt="user"
        className="avatar"
      />
      <div className="comment-content">
        <div className="comment-header">
          <span className="username">{comment.user.username}</span>
          {editing ? (
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <span className="text">{formatContent(comment.content)}</span>
          )}
          <FiMoreHorizontal className="more-icon" />
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
          <span className="like-btn" onClick={() => onLike(comment.id)}>
            ❤️ {comment._count?.likes || 0}
          </span>

          {currentUserId === comment.userId && (
            <div className="comment-actions">
              <button onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit"}
              </button>
              <button onClick={() => onDelete(comment.id)}>Delete</button>
            </div>
          )}

          <button onClick={() => setReplying(!replying)}>Reply</button>
        </div>

        {editing && (
          <div className="edit-box">
            <button onClick={handleUpdate}>Save</button>
          </div>
        )}

        {replying && (
          <div className="reply-box">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReply();
              }}
            />
            <button onClick={handleReply}>
              <IoMdSend size={18} />
            </button>
          </div>
        )}

       {comment.replies?.length ? (
          <>
            {!showReplies && (
              <button
                className="view-replies"
                onClick={() => setShowReplies(true)}
              >
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
    </div>
  );
};

export default CommentItem;
