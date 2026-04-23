import React, { useContext, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IoSearch,
  IoPersonSharp,
  IoChatboxEllipses,
  IoMoon,
  IoSunny,
} from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Logo from "../Logo/Logo";
import noProfile from "../../assets/profile/user.png";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import NotificationsInteractions from "../NotificationsInteractions/NotificationsInteractions";
import ChatNotificationsDropdown from "../ChatNotificationsDropdown/ChatNotificationsDropdown";
import NotificationsDropdown from "../NotificationsDropdown/NotificationsDropdown";

import { useNotificationStore } from "../../stores/notificationStore";
import { getIncomingFriendRequests, searchUsers } from "../../utils/api/user.api";
import { searchPosts } from "../../utils/api/post.api";

import type { AppLanguage } from "../../i18n";
import { saveLanguage } from "../../i18n";
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

const MOBILE_BREAKPOINT = 640;

const Navbar: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showChatNotifications, setShowChatNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [postResults, setPostResults] = useState<SearchPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const mobilePopupRef = useRef<HTMLDivElement | null>(null);

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
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (!(showFriendRequests || showChatNotifications || showNotifications)) {
      return;
    }

    const handleOutsideMobilePopup = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        mobilePopupRef.current &&
        !mobilePopupRef.current.contains(target)
      ) {
        closeAll();
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("mousedown", handleOutsideMobilePopup);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideMobilePopup);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showFriendRequests, showChatNotifications, showNotifications]);

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

  const handleLanguageChange = (language: AppLanguage) => {
    void i18n.changeLanguage(language);
    saveLanguage(language);
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
  const isHomeActive = true;

  const activeMobilePopupContent = showFriendRequests ? (
    <NotificationsInteractions onCountChange={setFriendRequestsCount} />
  ) : showChatNotifications ? (
    <ChatNotificationsDropdown />
  ) : showNotifications ? (
    <NotificationsDropdown onClose={closeAll} />
  ) : null;

  const renderDesktopPopup = (content: React.ReactNode) =>
    !isMobileViewport ? (
      <div
        className="notifications-popup"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    ) : null;

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo-link">
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
                placeholder={t("navbar.searchPlaceholder")}
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
                  <div className="search-empty">{t("navbar.searchLoading")}</div>
                ) : (
                  <>
                    {!isHashtagSearch && (
                      <div className="search-section">
                        <div className="search-section-title">{t("navbar.users")}</div>

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
                                <div className="search-result-title">
                                  @{item.username}
                                </div>
                                <div className="search-result-text">
                                  {item.desc?.trim() || item.city || t("navbar.user")}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="search-empty">{t("navbar.noUsers")}</div>
                        )}
                      </div>
                    )}

                    <div className="search-section">
                      <div className="search-section-title">
                        {isHashtagSearch ? t("navbar.postsByHashtag") : t("navbar.posts")}
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
                                {item.user?.username
                                  ? `@${item.user.username}`
                                  : t("navbar.post")}
                              </div>

                              <div className="search-result-text">
                                {item.desc?.trim()
                                  ? item.desc.slice(0, 90)
                                  : item.tags?.length
                                    ? `#${item.tags.join(" #").slice(0, 90)}`
                                    : t("navbar.noText")}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="search-empty">{t("navbar.noPosts")}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <nav className="tab-links">
            <Link to="/" className={`nav-pill ${isHomeActive ? "active" : ""}`}>
              {t("navbar.home")}
            </Link>
          </nav>

          <div className="language-switcher">
            <button
              type="button"
              className={`language-switcher__button ${i18n.language === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={`language-switcher__button ${i18n.language === "ru" ? "active" : ""}`}
              onClick={() => handleLanguageChange("ru")}
            >
              RU
            </button>
          </div>

          <div className="tab-icons">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={
                theme === "light"
                  ? t("navbar.enableDarkTheme")
                  : t("navbar.enableLightTheme")
              }
            >
              {theme === "light" ? <IoMoon /> : <IoSunny />}
            </button>

            <div className="tab-icon" onClick={toggleFriends}>
              <IoPersonSharp />
              {friendRequestsCount > 0 && (
                <span className="icon-badge">{friendRequestsCount}</span>
              )}

              {showFriendRequests &&
                renderDesktopPopup(
                  <NotificationsInteractions
                    onCountChange={setFriendRequestsCount}
                  />
                )}
            </div>

            <div className="tab-icon" onClick={toggleChat}>
              <IoChatboxEllipses />
              {chatUnreadCount > 0 && (
                <span className="icon-badge">{chatUnreadCount}</span>
              )}

              {showChatNotifications &&
                renderDesktopPopup(<ChatNotificationsDropdown />)}
            </div>

            <div className="tab-icon" onClick={toggleNotifications}>
              <IoIosNotifications />
              {generalUnreadCount > 0 && (
                <span className="icon-badge">{generalUnreadCount}</span>
              )}

              {showNotifications &&
                renderDesktopPopup(
                  <NotificationsDropdown onClose={closeAll} />
                )}
            </div>
          </div>

          <div className="profile-pic-div">
            <Link to={`/profile/${user?.username}`}>
              <img
                src={user?.profilePicture || noProfile}
                alt="User profile"
                className="profile-pic"
              />
            </Link>
          </div>
        </div>
      </header>

      {isMobileViewport &&
        activeMobilePopupContent &&
        createPortal(
          <div className="navbar-mobile-popup-layer">
            <div
              className="notifications-popup notifications-popup--mobile"
              ref={mobilePopupRef}
              onClick={(e) => e.stopPropagation()}
            >
              {activeMobilePopupContent}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Navbar;