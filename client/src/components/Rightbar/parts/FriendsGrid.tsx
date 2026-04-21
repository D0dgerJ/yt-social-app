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
  if (!friends.length) {
    return <div className="rightbar-empty">No friends yet</div>;
  }

  return (
    <div className="friends-grid">
      {friends.map((f) => (
        <Link to={`/profile/${f.username}`} key={f.id} className="friend-link">
          <div className="friend-card">
            <img
              src={f.profilePicture || fallbackAvatar}
              alt={f.username}
              className="friend-img"
            />
            <span className="friend-name">{f.username}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FriendsGrid;