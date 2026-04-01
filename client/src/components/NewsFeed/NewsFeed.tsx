import React, { useContext, useEffect, useState } from "react";
import UploadPost from "../UploadPost/UploadPost";
import Post from "../Post/Post";
import {
  getExplorePosts,
  getFeedPosts,
  getUserPostsByUsername,
} from "../../utils/api/post.api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Masonry from "react-masonry-css";
import "./NewsFeed.scss";

interface NewsFeedProps {
  mode?: "home" | "explore" | "profile";
}

type LikeEntity = number | string | { userId: number | string };

interface PostType {
  id: number;
  desc: string;
  createdAt: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
  score?: number | null;
  userId: number;
  user?: {
    username: string;
    profilePicture?: string;
  };
  likes: LikeEntity[];
  _count?: {
    likes: number;
    comments: number;
  };
}

const profileColumns = {
  default: 2,
  800: 1,
};

const feedColumns = {
  default: 2,
  900: 1,
};

const toLikeArray = (likes: unknown): LikeEntity[] => {
  return Array.isArray(likes) ? (likes as LikeEntity[]) : [];
};

const NewsFeed: React.FC<NewsFeedProps> = ({ mode = "home" }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const { username } = useParams();
  const { user } = useContext(AuthContext);

  const isProfile = mode === "profile";
  const isHome = mode === "home";

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data: any[] =
          mode === "profile"
            ? await getUserPostsByUsername(username as string)
            : mode === "explore"
            ? await getExplorePosts()
            : await getFeedPosts();

        const normalized: PostType[] = data.map((p: any) => {
          const likesArray = toLikeArray(p?.likes);

          const likesCount =
            p?._count?.likes ??
            (Array.isArray(likesArray) ? likesArray.length : 0) ??
            p?.likesCount ??
            0;

          const commentsCount =
            p?._count?.comments ??
            (typeof p?.commentsCount === "number"
              ? p.commentsCount
              : typeof p?.comment === "number"
              ? p.comment
              : 0);

          return {
            ...p,
            likes: likesArray,
            _count: { likes: likesCount, comments: commentsCount },
          };
        });

        setPosts(normalized);
      } catch (error) {
        console.error("Failed to load posts", error);
      }
    };

    loadPosts();
  }, [username, mode]);

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <div
      className={`newsFeed ${
        isProfile ? "newsFeed--profile" : "newsFeed--home"
      }`}
    >
      {isHome && <UploadPost />}

      <Masonry
        breakpointCols={isProfile ? profileColumns : feedColumns}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onDeleted={handlePostDeleted}
          />
        ))}
      </Masonry>
    </div>
  );
};

export default NewsFeed;