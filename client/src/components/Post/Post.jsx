import React, { useContext, useEffect, useState } from "react";
import { MdOutlineMoreVert } from "react-icons/md";
import { getUserData, likeAndDislikePost } from "../../utils/api/api";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";
import likeIcon from "../../assets/like.png";
import heartIcon from "../../assets/heart.png";
import userPic from "./assets/user.png";
import "./Post.scss";

const Post = ({ post }) => {
  const [like, setLike] = useState(post.likes?.length);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState({});
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    setIsLiked(post.likes?.includes(currentUser._id));
  }, [currentUser?._id, post.likes]);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const res = await getUserData(post.userId);
        setUser(res.data.userInfo);
      } catch (error) {
        console.log(error);
      }
    };
    getUserInfo();
  }, [post.userId]);

  const handleLike = async () => {
    try {
      await likeAndDislikePost(post.id);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  return (
    <div className="post-container">
      <div className="post-top">
        <div className="post-user">
          <img
            src={user.profilePicture || userPic}
            alt="Profile"
            className="post-avatar"
          />
          <Link to={`/profile/${user.username}`}>
            <span className="post-username">{user.username}</span>
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
          <span>{post.comment} comments</span>
        </div>
      </div>
    </div>
  );
};

export default Post;
