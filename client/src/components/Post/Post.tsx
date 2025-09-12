import React, { useContext, useEffect, useState } from "react";
import { MdOutlineMoreVert } from "react-icons/md";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";

import { getUserById } from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import usePostLikes from "../../hooks/usePostLike";

import PostModal from "../PostModal/PostModal";
import PostGallery from "./parts/PostGallery";
import PostMeta from "./parts/PostMeta";
import PostTags from "./parts/PostTags";
import PostVideos from "./parts/PostVideos";
import PostFiles from "./parts/PostFiles";

import userPic from "./assets/user.png";
import "./Post.scss";

type LikeEntity = number | string | { userId: number | string };

export interface PostProps {
  post: {
    id: number;
    userId: number;
    createdAt: string;
    desc?: string;
    images?: string[];
    videos?: string[];
    files?: string[];
    tags?: string[];
    location?: string;
    likes: LikeEntity[];
    _count?: { likes?: number; comments?: number };
    user?: { username: string; profilePicture?: string };
  };
}

type UserInfo = { id: number; username: string; profilePicture?: string };

const Post: React.FC<PostProps> = ({ post }) => {
  const { user: currentUser } = useContext(AuthContext);

  const [author, setAuthor] = useState<UserInfo | null>(
    post.user
      ? {
          id: post.userId,
          username: post.user.username,
          profilePicture: post.user.profilePicture,
        }
      : null
  );

  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (author) return;
    (async () => {
      try {
        const res = await getUserById(post.userId);
        setAuthor(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [post.userId, author]);

  const {
    count: likeCount,
    isLiked,
    loading: isLiking,
    toggle: toggleLike,
  } = usePostLikes({
    postId: post.id,
    likes: post.likes,
    initialCount: post._count?.likes,
    currentUserId: currentUser?.id,
  });

  const handleLike = async () => {
    if (!currentUser?.id || isLiking) return;
    try {
      await toggleLike();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to like");
    }
  };

  const commentsCount =
    post._count?.comments ??
    (typeof (post as any).commentsCount === "number"
      ? (post as any).commentsCount
      : typeof (post as any).comment === "number"
      ? (post as any).comment
      : 0);

  return (
    <div className="post-container" style={{ breakInside: "avoid" }}>
      <div className="post-top">
        <div className="post-user">
          <img
            src={author?.profilePicture || userPic}
            alt="Profile"
            className="post-avatar"
          />
          <Link to={`/profile/${author?.username}`}>
            <span className="post-username">{author?.username}</span>
          </Link>
          <span className="post-time">{moment(post.createdAt).fromNow()}</span>
        </div>
        <MdOutlineMoreVert className="options-icon" />
      </div>

      <div className="post-content">
        {post.desc && <span>{post.desc}</span>}

        <PostGallery
          images={post.images}
          gridClassName="post-image-grid"
          imgClassName="post-image-thumb"
          showEmpty={false}
        />

        <PostVideos videos={post.videos} />
        <PostFiles files={post.files} />

        {post.location && (
          <div className="post-location">📍 {post.location}</div>
        )}
      </div>

      <PostTags tags={post.tags} className="post-tags" />

      <div className="post-bottom">
        <PostMeta
          createdAt={post.createdAt}
          isLiked={isLiked}
          likes={likeCount}
          onToggle={handleLike}
          loading={isLiking}
          rootClassName="post-bottom"
          timeClassName="post-time"
          likesClassName="like-section"
          showTime={false}
          asButton={false}
        />

        <div className="comment-section" onClick={() => setShowPostModal(true)}>
          <span>{commentsCount} comments</span>
        </div>

        {showPostModal && (
          <PostModal post={post} onClose={() => setShowPostModal(false)} />
        )}
      </div>
    </div>
  );
};

export default Post;