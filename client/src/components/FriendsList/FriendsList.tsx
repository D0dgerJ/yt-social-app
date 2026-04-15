import React from "react";
import { Link } from "react-router-dom";
import "./FriendsList.scss";

interface Friend {
  id: number;
  username: string;
  profilePicture: string;
}

interface FriendsListProps {
  friend: Friend;
}

const FriendsList: React.FC<FriendsListProps> = ({ friend }) => {
  return (
    <li className="friend-item">
      <Link to={`/profile/${friend.username}`} className="friend-link">
        <div className="friend-avatar-wrapper">
          <img
            src={friend.profilePicture}
            alt={friend.username}
            className="friend-image"
          />
        </div>

        <span className="friend-name">{friend.username}</span>
      </Link>
    </li>
  );
};

export default FriendsList;