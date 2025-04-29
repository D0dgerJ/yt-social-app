import React from "react";
import "./OnlineUsers.scss";

const OnlineUsers = ({ user }) => {
  return (
    <li className="online-user">
      <div className="user-image-wrapper">
        <img
          src={user.profilePicture}
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
