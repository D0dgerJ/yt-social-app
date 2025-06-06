import React, { useContext, useEffect, useState } from "react";
import UploadPost from "../UploadPost/UploadPost";
import Post from "../Post/Post";
import { getFeedPosts, getUserPostsByUsername } from "../../utils/api/post.api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Masonry from "react-masonry-css";
import "./NewsFeed.scss";

interface NewsFeedProps {
  userPosts?: boolean;
}

interface PostType {
  id: number;
  desc: string;
  createdAt: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  userId: number;
  user: {
    username: string;
    profilePicture?: string;
  };
  likes: number[];
}

const profileColumns = {
  default: 4,
  1200: 3,
  900: 2,
  600: 1,
};

const feedColumns = {
  default: 2,
  900: 1,
};

const NewsFeed: React.FC<NewsFeedProps> = ({ userPosts }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const { username } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const timelinePosts = async () => {
      try {
        const data = userPosts
          ? await getUserPostsByUsername(username as string)
          : await getFeedPosts();
        setPosts(data);
      } catch (error) {
        console.error("Failed to load posts", error);
      }
    };
    timelinePosts();
  }, [username, userPosts]);

  return (
    <div className={`newsFeed ${userPosts ? "newsFeed--profile" : "newsFeed--home"}`}>
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
