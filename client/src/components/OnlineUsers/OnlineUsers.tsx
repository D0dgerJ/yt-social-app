import React from "react";
import { Link } from "react-router-dom";
import "./OnlineUsers.scss";
import profilePic from "./assets/no-profile-image.png";

interface OnlineUserProps {
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
}

const OnlineUsers: React.FC<OnlineUserProps> = ({ user }) => {
  return (
    <li className="online-user">
      <Link to={`/profile/${user.id}`} className="online-user-link">
        <div className="user-image-wrapper">
          <img
            src={user.profilePicture || profilePic}
            alt="profile"
            className="user-image"
          />
          <span className="online-badge"></span>
        </div>
        <span className="user-name">{user.username}</span>
      </Link>
    </li>
  );
};

export default OnlineUsers;
