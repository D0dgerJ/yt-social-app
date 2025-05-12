import React from "react";
import "./OnlineUsers.scss";
import profilePic from "./assets/no-profile-image.png";

interface OnlineUserProps {
  user: {
    username: string;
    profilePicture?: string;
  };
}

const OnlineUsers: React.FC<OnlineUserProps> = ({ user }) => {
  return (
    <li className="online-user">
      <div className="user-image-wrapper">
        <img
          src={user.profilePicture || profilePic}
          alt="profile picture"
          className="user-image"
        />
        <span className="online-badge"></span>
      </div>
      <span className="user-name">{user.username}</span>
    </li>
  );
};

export default OnlineUsers;
