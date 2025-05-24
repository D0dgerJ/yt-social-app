import React, { useEffect, useState, useContext } from "react";
import moment from "moment";
import { AuthContext } from "../../context/AuthContext";
import { getCommentReplies, createReply, toggleCommentLike } from "../../utils/api/comment.api";
import likeIcon from "../../assets/like.png";
import "./ReplySection.scss";

interface ReplySectionProps {
  postId: number;
  parentId: number;
  onReply: () => void;
}

interface Reply {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  _count?: {
    likes: number;
  };
  likes?: { userId: number }[];
}

const ReplySection: React.FC<ReplySectionProps> = ({ parentId, postId, onReply }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");

  const fetchReplies = async () => {
    try {
      const res = await getCommentReplies(parentId);
      setReplies(res);
    } catch (err) {
      console.error("Failed to load replies", err);
    }
  };

  const handleReplySubmit = async () => {
    if (!newReply.trim()) return;
    try {
      await createReply({ postId, parentId: parentId, content: newReply });
      setNewReply("");
      fetchReplies();
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  const handleLike = async (replyId: number) => {
    try {
      await toggleCommentLike(replyId);
      fetchReplies();
    } catch (err) {
      console.error("Failed to like reply", err);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [parentId]);

  return (
    <div className="reply-section">
      {replies.map((reply) => (
        <div key={reply.id} className="reply-item">
          <img
            src={reply.user.profilePicture || "/default-avatar.png"}
            alt="user"
            className="reply-avatar"
          />
          <div className="reply-body">
            <div className="reply-header">
              <span className="reply-username">{reply.user.username}</span>
              <span className="reply-content">{reply.content}</span>
            </div>
            <div className="reply-meta">
              <span className="reply-time">{moment(reply.createdAt).fromNow()}</span>
              <img
                src={likeIcon}
                alt="like"
                className="reply-like-icon"
                onClick={() => handleLike(reply.id)}
              />
              <span className="reply-like-count">{reply._count?.likes || 0}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="reply-input">
        <input
          type="text"
          value={newReply}
          placeholder="Reply..."
          onChange={(e) => setNewReply(e.target.value)}
        />
        <button onClick={handleReplySubmit}>Post</button>
      </div>
    </div>
  );
};

export default ReplySection;
