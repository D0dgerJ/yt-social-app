import React from "react";
import { Link } from "react-router-dom";

type Friend = {
  id: number;
  username: string;
  profilePicture: string;
};

type Props = {
  friends: Friend[];
  fallbackAvatar: string;
};

const FriendsGrid: React.FC<Props> = ({ friends, fallbackAvatar }) => {
  return (
    <div className="friends-grid">
      {friends.map((f) => (
        <Link to={`/profile/${f.username}`} key={f.id}>
          <div className="friend-card">
            <img
              src={f.profilePicture || fallbackAvatar}
              alt="Friend"
              className="friend-img"
            />
            <span>{f.username}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FriendsGrid;
