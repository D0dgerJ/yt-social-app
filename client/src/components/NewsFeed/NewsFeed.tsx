import React, { useContext, useEffect, useState } from "react";
import UploadPost from "../UploadPost/UploadPost";
import Post from "../Post/Post";
import { getFeedPosts, getUserPostsByUsername } from "../../utils/api/post.api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
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
    <div className="newsfeed">
      {(!username || username === user?.username) && <UploadPost />}
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

export default NewsFeed;
