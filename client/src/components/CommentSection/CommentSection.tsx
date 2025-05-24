import React, { useEffect, useState, useContext, ChangeEvent } from "react";
import { getPostComments, createComment, toggleCommentLike } from "../../utils/api/comment.api";
import { AuthContext } from "../../context/AuthContext";
import moment from "moment";
import likeIcon from "../../assets/like.png";
import EmojiPicker from "emoji-picker-react";
import "./CommentSection.scss";

interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
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
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                _count: {
                  likes: c._count?.likes
                    ? c.likes?.some((l) => l.userId === currentUser?.id)
                      ? c._count.likes - 1
                      : c._count.likes + 1
                    : 1,
                },
                likes: c.likes?.some((l) => l.userId === currentUser?.id)
                  ? c.likes?.filter((l) => l.userId !== currentUser?.id)
                  : [...(c.likes || []), { userId: currentUser!.id }],
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to like comment", err);
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
            <span className="content">{comment.content}</span>
            <div className="meta">
              <span className="time">{moment(comment.createdAt).fromNow()}</span>
              <img
                src={likeIcon}
                className="like-icon"
                onClick={() => handleLike(comment.id)}
                alt="like"
              />
              <span>{comment._count?.likes || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentSection;
