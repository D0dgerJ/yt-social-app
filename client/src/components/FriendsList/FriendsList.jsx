import React from "react";
import "./FriendsList.scss";

const FriendsList = ({ friend }) => {
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
