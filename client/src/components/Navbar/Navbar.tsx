import React, { useContext, useState } from "react";
import {
  IoSearch,
  IoPersonSharp,
  IoChatboxEllipses,
} from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import Logo from "../Logo/Logo";
import noProfile from "../../assets/profile/user.png";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.scss";
import NotificationsInteractions from "../NotificationsInteractions/NotificationsInteractions";
// число notification должно меняться в зависемости от количества уведомлений (когда перейдёш к уведомлениям)

const Navbar: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <div className="logo-div">
            <Logo />
          </div>
        </Link>
      </div>

      <div className="navbar-center">
        <div className="search-bar">
          <IoSearch className="search-icon" />
          <input type="text" className="search-input" />
        </div>
      </div>

      <div className="navbar-right">
        <div className="tab-links">
          <span>Home</span>
          <span>Timeline</span>
        </div>
        <div className="tab-icons">
          <div className="tab-icon">
            <IoPersonSharp />
            <span className="icon-badge">1</span>
          </div>
          <div className="tab-icon">
            <IoChatboxEllipses />
            <span className="icon-badge">1</span>
          </div>
          <div
            className="tab-icon"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IoIosNotifications />
            <span className="icon-badge">1</span>
            {showNotifications && (
              <div className="notifications-popup">
                <NotificationsInteractions />
              </div>
            )}
          </div>
        </div>

        <div className="profile-pic-div">
          <Link to={`/profile/${user?.username}`}>
            <img
              src={user?.profilePicture || noProfile}
              alt="A user Profile Picture"
              className="profile-pic"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
