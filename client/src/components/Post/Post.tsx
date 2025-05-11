import React, { useContext, useEffect, useState } from "react";
import { MdOutlineMoreVert } from "react-icons/md";
import { toggleLike } from "../../utils/api/post.api";
import { getUserById } from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";
import likeIcon from "../../assets/like.png";
import heartIcon from "../../assets/heart.png";
import userPic from "./assets/user.png";
import "./Post.scss";

interface PostProps {
  post: {
    id: number;
    userId: number;
    desc?: string;
    createdAt: string;
    img?: string;
    likes: number[];
    comment?: number;
  };
}

interface UserInfo {
  username: string;
  profilePicture?: string;
  id: number;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const [like, setLike] = useState<number>(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (currentUser) {
      setIsLiked(post.likes.includes(currentUser.id));
    }
  }, [currentUser?.id, post.likes]);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const res = await getUserById(post.userId);
        setUser(res);
      } catch (error: any) {
        console.log(error);
      }
    };
    getUserInfo();
  }, [post.userId]);

  const handleLike = async () => {
    try {
      await toggleLike (post.id);
      setLike((prev) => (isLiked ? prev - 1 : prev + 1));
      setIsLiked(!isLiked);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Like failed");
    }
  };

  return (
    <div className="post-container">
      <div className="post-top">
        <div className="post-user">
          <img
            src={user?.profilePicture || userPic}
            alt="Profile"
            className="post-avatar"
          />
          <Link to={`/profile/${user?.username}`}>
            <span className="post-username">{user?.username}</span>
          </Link>
          <span className="post-time">{moment(post.createdAt).fromNow()}</span>
        </div>
        <MdOutlineMoreVert className="options-icon" />
      </div>

      <div className="post-content">
        <span>{post?.desc}</span>
        {post.img && (
          <img
            src={post.img}
            alt="Post Content"
            className="post-image"
          />
        )}
      </div>

      <div className="post-bottom">
        <div className="like-section">
          <img
            src={likeIcon}
            alt="Like"
            className="like-icon"
            onClick={handleLike}
          />
          <img
            src={heartIcon}
            alt="Heart"
            className="like-icon"
            onClick={handleLike}
          />
          <span>{like} likes</span>
        </div>
        <div className="comment-section">
          <span>{post.comment || 0} comments</span>
        </div>
      </div>
    </div>
  );
};

export default Post;
