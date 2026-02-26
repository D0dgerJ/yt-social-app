import React, { useContext, useState, useRef, ChangeEvent } from "react";
import { AuthContext } from "../../context/AuthContext";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import { useComments } from "./utils";
import CommentItem from "./CommentItem";
import "./CommentSection.scss";

const CommentSection: React.FC<{ postId: number }> = ({ postId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = currentUser?.id ?? null;

  const [newComment, setNewComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  const { comments, addComment, addReply, likeComment, deleteCommentById, updateCommentById } = useComments(postId);

  const handleCommentSubmit = async () => {
    if (!currentUserId) return;
    if (!newComment.trim()) return;
    await addComment(newComment, imageFile);
    setNewComment("");
    setImageFile(null);
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
    <div className="comment-section">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onReply={addReply}
          onLike={likeComment}
          onDelete={deleteCommentById}
          onUpdate={updateCommentById}
        />
      ))}

      {/* Инпут только для авторизованных */}
      {!!currentUserId && (
        <div className="comment-input">
          <input
            type="text"
            value={newComment}
            placeholder="Add a comment..."
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
          />
          <div ref={emojiRef} className="emoji-wrapper">
            <BsEmojiSmile onClick={() => setShowEmoji(!showEmoji)} size={20} />
            {showEmoji && <EmojiPicker onEmojiClick={handleEmojiClick} />}
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <button onClick={handleCommentSubmit}>
            <IoMdSend size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;