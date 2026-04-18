import React, {
  useContext,
  useState,
  useRef,
  ChangeEvent,
  useEffect,
} from "react";
import { AuthContext } from "../../context/AuthContext";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile, BsImage } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { useComments } from "./utils";
import CommentItem from "./CommentItem";
import "./CommentSection.scss";

interface CommentSectionProps {
  postId: number;
  targetCommentId?: number;
}

type ReplyTarget = {
  commentId: number;
  username: string;
} | null;

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  targetCommentId,
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = currentUser?.id ?? null;

  const [newComment, setNewComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget>(null);

  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    comments,
    addComment,
    addReply,
    likeComment,
    deleteCommentById,
    updateCommentById,
  } = useComments(postId);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmoji(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleCommentSubmit = async () => {
    if (!currentUserId) return;
    if (!newComment.trim()) return;

    if (replyTarget) {
      await addReply(replyTarget.commentId, newComment.trim());
    } else {
      await addComment(newComment.trim(), imageFile);
    }

    setNewComment("");
    setImageFile(null);
    setShowEmoji(false);
    setReplyTarget(null);
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewComment((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleStartReply = (commentId: number, username: string) => {
    setReplyTarget({ commentId, username });
    setShowEmoji(false);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
    inputRef.current?.focus();
  };

  const inputPlaceholder = replyTarget
    ? `Reply to ${replyTarget.username}...`
    : "Add a comment...";

  return (
    <div className="post-comments">
      <div className="post-comments__list">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={addReply}
            onLike={likeComment}
            onDelete={deleteCommentById}
            onUpdate={updateCommentById}
            targetCommentId={targetCommentId}
            onStartReply={handleStartReply}
          />
        ))}
      </div>

      {!!currentUserId && (
        <>
          {replyTarget && (
            <div className="post-comments__reply-state">
              <span className="post-comments__reply-state-text">
                Replying to <strong>{replyTarget.username}</strong>
              </span>

              <button
                type="button"
                className="post-comments__reply-cancel"
                onClick={handleCancelReply}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="post-comments__input">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              placeholder={inputPlaceholder}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCommentSubmit();
                }
              }}
            />

            <div ref={emojiRef} className="post-comments__emoji-wrapper">
              <button
                type="button"
                className="post-comments__icon-button"
                onClick={() => setShowEmoji((v) => !v)}
                aria-label="Open emoji picker"
              >
                <BsEmojiSmile size={18} />
              </button>

              {showEmoji && (
                <div className="post-comments__emoji-popover">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>

            <label
              className="post-comments__icon-button post-comments__file-button"
              aria-label="Upload image"
            >
              <BsImage size={18} />
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>

            <button
              type="button"
              className="post-comments__send-button"
              onClick={handleCommentSubmit}
              aria-label={replyTarget ? "Send reply" : "Send comment"}
            >
              <IoMdSend size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CommentSection;