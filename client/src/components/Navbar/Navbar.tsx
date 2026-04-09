import React, { useContext, useState, useEffect, useRef } from "react";
import { IoSearch, IoPersonSharp, IoChatboxEllipses } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";

import Logo from "../Logo/Logo";
import noProfile from "../../assets/profile/user.png";
import { AuthContext } from "../../context/AuthContext";

import NotificationsInteractions from "../NotificationsInteractions/NotificationsInteractions";
import ChatNotificationsDropdown from "../ChatNotificationsDropdown/ChatNotificationsDropdown";
import NotificationsDropdown from "../NotificationsDropdown/NotificationsDropdown";

import { useNotificationStore } from "../../stores/notificationStore";
import { getIncomingFriendRequests, searchUsers } from "../../utils/api/user.api";
import { searchPosts } from "../../utils/api/post.api";

import "./Navbar.scss";

type SearchUser = {
  id: number;
  username: string;
  profilePicture?: string | null;
  desc?: string | null;
  city?: string | null;
};

type SearchPost = {
  id: number;
  desc?: string | null;
  tags?: string[];
  user?: {
    id: number;
    username: string;
    profilePicture?: string | null;
  };
};

const Navbar: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showChatNotifications, setShowChatNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [postResults, setPostResults] = useState<SearchPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setUserResults([]);
      setPostResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    const hashtagMode = trimmed.startsWith("#");

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);

        if (hashtagMode) {
          const postsRes = await searchPosts(trimmed, 6);

          setUserResults([]);
          setPostResults(Array.isArray(postsRes?.items) ? postsRes.items : []);
          setShowSearchDropdown(true);
          return;
        }

        const [usersRes, postsRes] = await Promise.all([
          searchUsers(trimmed, 6),
          searchPosts(trimmed, 6),
        ]);

        setUserResults(Array.isArray(usersRes?.items) ? usersRes.items : []);
        setPostResults(Array.isArray(postsRes?.items) ? postsRes.items : []);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error("[Navbar] search failed:", error);
        setUserResults([]);
        setPostResults([]);
        setShowSearchDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const clearSearch = () => {
    setSearchQuery("");
    setUserResults([]);
    setPostResults([]);
    setShowSearchDropdown(false);
  };

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
    clearSearch();
  };

  const handlePostClick = (post: SearchPost) => {
    if (post.user?.username) {
      navigate(`/profile/${post.user.username}`);
      clearSearch();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (userResults.length > 0) {
      handleUserClick(userResults[0].username);
      return;
    }

    if (postResults.length > 0) {
      handlePostClick(postResults[0]);
      return;
    }

    setShowSearchDropdown(true);
  };

  const isHashtagSearch = searchQuery.trim().startsWith("#");

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
        <div className="search-wrapper" ref={searchRef}>
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <IoSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Найти пользователей, посты или #хэштег"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowSearchDropdown(true);
                }
              }}
            />
          </form>

          {showSearchDropdown && searchQuery.trim() && (
            <div className="search-dropdown">
              {isSearching ? (
                <div className="search-empty">Поиск...</div>
              ) : (
                <>
                  {!isHashtagSearch && (
                    <div className="search-section">
                      <div className="search-section-title">Пользователи</div>

                      {userResults.length > 0 ? (
                        userResults.map((item) => (
                          <button
                            key={`user-${item.id}`}
                            type="button"
                            className="search-result-item"
                            onClick={() => handleUserClick(item.username)}
                          >
                            <img
                              src={item.profilePicture || noProfile}
                              alt={item.username}
                              className="search-result-avatar"
                            />

                            <div className="search-result-content">
                              <div className="search-result-title">@{item.username}</div>
                              <div className="search-result-text">
                                {item.desc?.trim() || item.city || "Пользователь"}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="search-empty">Пользователи не найдены</div>
                      )}
                    </div>
                  )}

                  <div className="search-section">
                    <div className="search-section-title">
                      {isHashtagSearch ? "Посты по хэштегу" : "Посты"}
                    </div>

                    {postResults.length > 0 ? (
                      postResults.map((item) => (
                        <button
                          key={`post-${item.id}`}
                          type="button"
                          className="search-result-item"
                          onClick={() => handlePostClick(item)}
                        >
                          <div className="search-result-content">
                            <div className="search-result-title">
                              {item.user?.username ? `@${item.user.username}` : "Пост"}
                            </div>

                            <div className="search-result-text">
                              {item.desc?.trim()
                                ? item.desc.slice(0, 90)
                                : item.tags?.length
                                  ? `#${item.tags.join(" #").slice(0, 90)}`
                                  : "Без текста"}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="search-empty">Посты не найдены</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <div className="tab-links">
          <span>Home</span>
          <span>Timeline</span>
        </div>

        <div className="tab-icons">
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