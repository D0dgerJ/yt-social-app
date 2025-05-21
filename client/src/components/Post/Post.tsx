import React, { useContext, useEffect, useState } from "react";
import { MdOutlineMoreVert } from "react-icons/md";
import { toggleLike } from "../../utils/api/post.api";
import { getUserById } from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
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
    likes: number[];
    comment?: number;
    images?: string[];
    videos?: string[];
    files?: string[];
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
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const { user: currentUser } = useContext(AuthContext);

  const userId = currentUser?.id;
  const images = post.images ?? [];
  const videos = post.videos ?? [];
  const files = post.files ?? [];

  useEffect(() => {
    if (userId) {
      setIsLiked(post.likes.includes(userId));
    }
  }, [userId, post.likes]);

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
    if (!userId || isLiked) return;

    try {
      await toggleLike(post.id);
      setLike((prev) => prev + 1);
      setIsLiked(true);
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
        {post.desc && <span>{post.desc}</span>}

        {/* Изображения */}
        {images.length > 0 && (
          <div className="post-image-grid">
            {images.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="post-image-thumb"
                onClick={() => {
                  setLightboxIndex(index);
                  setIsLightboxOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Видео */}
        {videos.length > 0 &&
          videos.map((url, index) => (
            <video key={index} controls className="post-video">
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ))}

        {/* Файлы */}
       {files.length > 0 && (
          <div className="post-files">
            {files.map((url, index) => {
              const fileName = url.split("/").pop();
              return (
                <div className="post-file-wrapper" key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-file-link"
                  >
                    📎 {fileName}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && post.images && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={post.images.map((url, index) => ({ src: url, key: `slide-${index}` }))}
          index={lightboxIndex}
          on={{ view: ({ index }) => setLightboxIndex(index) }}
          plugins={[Thumbnails]}
          render={{
            buttonClose: () => (
              <button
                className="lightbox-close-button"
                onClick={() => setIsLightboxOpen(false)}
                type="button"
              >
                ×
              </button>
            ),
          }}
        />
      )}

      <div className="post-bottom">
        <div className="like-section">
          <img
            src={likeIcon}
            alt="Like"
            className={`like-icon ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
          />
          <img
            src={heartIcon}
            alt="Heart"
            className={`like-icon ${isLiked ? "liked" : ""}`}
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
