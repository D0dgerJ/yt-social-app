import React, { useContext, useState, useEffect } from "react";
import { IoSearch, IoPersonSharp, IoChatboxEllipses } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import { Link } from "react-router-dom";

import Logo from "../Logo/Logo";
import noProfile from "../../assets/profile/user.png";
import { AuthContext } from "../../context/AuthContext";

import NotificationsInteractions from "../NotificationsInteractions/NotificationsInteractions";
import ChatNotificationsDropdown from "../ChatNotificationsDropdown/ChatNotificationsDropdown";
import NotificationsDropdown from "../NotificationsDropdown/NotificationsDropdown";

import { useNotificationStore } from "../../stores/notificationStore";
import { getIncomingFriendRequests } from "../../utils/api/user.api";

import "./Navbar.scss";

const Navbar: React.FC = () => {
  const { user } = useContext(AuthContext);

  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showChatNotifications, setShowChatNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  const {
    fetchNotifications,
    unreadCount: generalUnreadCount,
    chatUnreadCount,
  } = useNotificationStore();

  useEffect(() => {
    if (!user) {
      setFriendRequestsCount(0);
      return;
    }

    fetchNotifications();

    const loadFriendRequestsCount = async () => {
      try {
        const data = await getIncomingFriendRequests();
        const safe = Array.isArray(data) ? data : [];
        setFriendRequestsCount(safe.length);
      } catch (e) {
        console.error("[Navbar] failed to load friend requests:", e);
      }
    };

    loadFriendRequestsCount();
  }, [user, fetchNotifications]);

  const closeAll = () => {
    setShowFriendRequests(false);
    setShowChatNotifications(false);
    setShowNotifications(false);
  };

  const toggleFriends = () => {
    setShowFriendRequests((prev) => !prev);
    setShowChatNotifications(false);
    setShowNotifications(false);
  };

  const toggleChat = () => {
    setShowChatNotifications((prev) => !prev);
    setShowFriendRequests(false);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowFriendRequests(false);
    setShowChatNotifications(false);
  };

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
          {/* Друзья / подписки */}
          <div className="tab-icon" onClick={toggleFriends}>
            <IoPersonSharp />
            {friendRequestsCount > 0 && (
              <span className="icon-badge">{friendRequestsCount}</span>
            )}

            {showFriendRequests && (
              <div
                className="notifications-popup"
                onClick={(e) => e.stopPropagation()}
              >
                <NotificationsInteractions
                  onCountChange={setFriendRequestsCount}
                />
              </div>
            )}
          </div>

          {/* Чаты */}
          <div className="tab-icon" onClick={toggleChat}>
            <IoChatboxEllipses />
            {chatUnreadCount > 0 && (
              <span className="icon-badge">{chatUnreadCount}</span>
            )}

            {showChatNotifications && (
              <div
                className="notifications-popup"
                onClick={(e) => e.stopPropagation()}
              >
                <ChatNotificationsDropdown />
              </div>
            )}
          </div>

          {/* Общие уведомления (лайки, комменты и т.п.) */}
          <div className="tab-icon" onClick={toggleNotifications}>
            <IoIosNotifications />
            {generalUnreadCount > 0 && (
              <span className="icon-badge">{generalUnreadCount}</span>
            )}

            {showNotifications && (
              <div
                className="notifications-popup"
                onClick={(e) => e.stopPropagation()}
              >
                <NotificationsDropdown onClose={closeAll} />
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