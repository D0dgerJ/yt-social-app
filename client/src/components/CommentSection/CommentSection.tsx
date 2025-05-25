import React, {
  useEffect,
  useState,
  useContext,
  ChangeEvent,
  useRef,
} from "react";
import {
  getPostComments,
  createComment,
  toggleCommentLike,
  deleteComment,
  updateComment,
} from "../../utils/api/comment.api";
import { AuthContext } from "../../context/AuthContext";
import { FiMoreHorizontal } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import moment from "moment";
import EmojiPicker from "emoji-picker-react";
import "./CommentSection.scss";

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  parentId?: number | null;
  images?: string[];
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  _count?: { likes: number };
  likes?: { userId: number }[];
  replies?: Comment[];
}

const CommentSection: React.FC<{ postId: number }> = ({ postId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    try {
      const res = await getPostComments(postId);
      const topLevel = res.filter((c: Comment) => c.parentId === null);
      const replies = res.filter((c: Comment) => c.parentId !== null);

      // Вложим ответы в родительские комментарии
      const commentsWithReplies = topLevel.map((parent: Comment) => {
        const parentReplies = replies.filter((r: Comment) => r.parentId === parent.id);
        return {
          ...parent,
          replies: parentReplies.length ? parentReplies : [],
        };
      });

      setComments(commentsWithReplies);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
      setShowEmoji(false);
    }
  };

  useEffect(() => {
    fetchComments();
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment({
        postId,
        content: newComment,
        images: imageFile ? [URL.createObjectURL(imageFile)] : [],
      });
      setNewComment("");
      setImageFile(null);
      fetchComments();
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleReplySubmit = async (parentId: number) => {
    const content = replyInputs[parentId]?.trim();
    if (!content) return;

    try {
      const newReply = await createComment({ postId, content, parentId });

      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            };
          }
          return comment;
        })
      );

      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to reply", err);
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      await toggleCommentLike(commentId);
      fetchComments();
    } catch (err) {
      console.error("Failed to like comment", err);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleUpdate = async (commentId: number) => {
    try {
      await updateComment({ commentId, content: editedContent });
      setEditingCommentId(null);
      fetchComments();
    } catch (err) {
      console.error("Failed to update comment", err);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewComment((prev) => prev + emojiData.emoji);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
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

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`comment-item ${isReply ? "reply-item" : ""}`}
    >
      <img
        src={comment.user.profilePicture || "/default-avatar.png"}
        alt="user"
        className="avatar"
      />
      <div className="comment-content">
        <div className="comment-header">
          <span className="username">{comment.user.username}</span>
          <span className="text">{formatContent(comment.content)}</span>
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
          <span className="like-btn" onClick={() => handleLike(comment.id)}>
            ❤️ {comment._count?.likes || 0}
          </span>
          {currentUser?.id === comment.userId && (
            <div className="comment-actions">
              <button onClick={() => setEditingCommentId(comment.id)}>Edit</button>
              <button onClick={() => handleDelete(comment.id)}>Delete</button>
            </div>
          )}
          <button onClick={() => setReplyingTo(comment.id)}>Reply</button>
        </div>

        {editingCommentId === comment.id && (
          <div className="edit-box">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit comment"
            />
            <button onClick={() => handleUpdate(comment.id)}>Save</button>
          </div>
        )}

        {replyingTo === comment.id && (
          <div className="reply-box">
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyInputs[comment.id] || ""}
              onChange={(e) =>
                setReplyInputs((prev) => ({
                  ...prev,
                  [comment.id]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleReplySubmit(comment.id);
              }}
            />
            <button onClick={() => handleReplySubmit(comment.id)}>
              <IoMdSend size={18} />
            </button>
          </div>
        )}

        {comment.replies?.length ? (
          <div className="replies">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="comment-section">
      {comments.map((comment) => renderComment(comment))}

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
    </div>
  );
};

export default CommentSection;
