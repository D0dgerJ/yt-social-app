import React, { useContext, useState, useRef, ChangeEvent, useEffect } from "react";
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

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  targetCommentId,
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = currentUser?.id ?? null;

  const [newComment, setNewComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

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
      if (e.key === "Escape") setShowEmoji(false);
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

    await addComment(newComment, imageFile);
    setNewComment("");
    setImageFile(null);
    setShowEmoji(false);
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewComment((prev) => prev + emojiData.emoji);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

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
          />
        ))}
      </div>

      {!!currentUserId && (
        <div className="post-comments__input">
          <input
            type="text"
            value={newComment}
            placeholder="Add a comment..."
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
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
            aria-label="Send comment"
          >
            <IoMdSend size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;