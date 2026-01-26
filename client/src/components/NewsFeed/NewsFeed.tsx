import React, { useContext, useEffect, useState } from "react";
import UploadPost from "../UploadPost/UploadPost";
import Post from "../Post/Post";
import { getAllPosts, getUserPostsByUsername } from "../../utils/api/post.api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Masonry from "react-masonry-css";
import "./NewsFeed.scss";

interface NewsFeedProps {
  userPosts?: boolean;
}

type LikeEntity = number | string | { userId: number | string };

interface PostType {
  id: number;
  desc: string;
  createdAt: string;
  images?: string[];
  videos?: string[];
  files?: string[];
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

const NewsFeed: React.FC<NewsFeedProps> = ({ userPosts }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const { username } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const timelinePosts = async () => {
      try {
        const data: any[] = userPosts
          ? await getUserPostsByUsername(username as string)
          : await getAllPosts();

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

    timelinePosts();
  }, [username, userPosts]);

  return (
    <div
      className={`newsFeed ${
        userPosts ? "newsFeed--profile" : "newsFeed--home"
      }`}
    >
      {(!username || username === user?.username) && <UploadPost />}

      <Masonry
        breakpointCols={userPosts ? profileColumns : feedColumns}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </Masonry>
    </div>
  );
};

export default NewsFeed;
