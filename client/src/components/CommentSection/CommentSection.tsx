import React, { useEffect, useState, useContext, ChangeEvent } from "react";
import {
  getPostComments,
  createComment,
  toggleCommentLike,
  deleteComment,
  updateComment,
  getCommentReplies,
  createReply
} from "../../utils/api/comment.api";
import { AuthContext } from "../../context/AuthContext";
import moment from "moment";
import likeIcon from "../../assets/like.png";
import EmojiPicker from "emoji-picker-react";
import ReplySection from "./ReplySection";
import "./CommentSection.scss";

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  images?: string[];
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  _count?: { likes: number };
  likes?: { userId: number }[];
}

const CommentSection: React.FC<{ postId: number }> = ({ postId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const fetchComments = async () => {
    try {
      const res = await getPostComments(postId);
      setComments(res);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment({ postId, content: newComment });
      setNewComment("");
      setImageFile(null);
      fetchComments();
    } catch (err) {
      console.error("Failed to post comment", err);
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

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <div className="comment-section">
      <div className="comment-input">
        <input
          type="text"
          value={newComment}
          placeholder="Write a comment..."
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={handleCommentSubmit}>Send</button>
        {showEmoji && <EmojiPicker onEmojiClick={handleEmojiClick} />}
      </div>

      {comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          <img src={comment.user.profilePicture || "/default-avatar.png"} alt="user" />
          <div className="comment-body">
            <span className="username">{comment.user.username}</span>

            {editingCommentId === comment.id ? (
              <>
                <input
                  type="text"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
                <button onClick={() => handleUpdate(comment.id)}>Save</button>
              </>
            ) : (
              <span className="content">{comment.content}</span>
            )}

            {comment.images && comment.images.length > 0 && (
              <div className="comment-images">
                {comment.images.map((img, idx) => (
                  <img key={idx} src={img} alt="attachment" className="comment-img" />
                ))}
              </div>
            )}

            <div className="meta">
              <span className="time">{moment(comment.createdAt).fromNow()}</span>
              <img
                src={likeIcon}
                className="like-icon"
                onClick={() => handleLike(comment.id)}
                alt="like"
              />
              <span>{comment._count?.likes || 0}</span>
              {currentUser?.id === comment.userId && (
                <>
                  <button onClick={() => setEditingCommentId(comment.id)}>Edit</button>
                  <button onClick={() => handleDelete(comment.id)}>Delete</button>
                </>
              )}
              <button onClick={() => setReplyingTo(comment.id)}>Reply</button>
            </div>

            {replyingTo === comment.id && (
              <ReplySection
                postId={postId}
                parentId={comment.id}
                onReply={() => {
                  setReplyingTo(null);
                  fetchComments();
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSection;
