import React from "react";
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
      <img
        src={friend.profilePicture}
        alt="profileImage"
        className="friend-image"
      />
      <span className="friend-name">{friend.username}</span>
    </li>
  );
};

export default FriendsList;
