import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SiFeedly } from "react-icons/si";
import {
  BiSolidVideos,
  BiCalendar,
  BiCompass,
  BiShieldQuarter,
} from "react-icons/bi";
import { IoChatboxEllipsesSharp } from "react-icons/io5";

import FriendsList from "../FriendsList/FriendsList";
import { AuthContext } from "../../context/AuthContext";
import useFriends from "../../hooks/useFriends";

import "./Sidebar.scss";

const Sidebar: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const { data: friends, loading, error } = useFriends(
    typeof user?.id === "number" ? user.id : undefined
  );

  const role = (user as any)?.role;
  const canModerate =
    role === "MODERATOR" || role === "ADMIN" || role === "OWNER";

  const navItems = [
    {
      to: "/",
      label: t("sidebar.home"),
      icon: <SiFeedly className="sidebar-icon" />,
    },
    {
      to: "/explore",
      label: t("sidebar.explore"),
      icon: <BiCompass className="sidebar-icon" />,
    },
    {
      to: "/shorts",
      label: t("sidebar.videos"),
      icon: <BiSolidVideos className="sidebar-icon" />,
    },
    {
      to: "/chat",
      label: t("sidebar.chat"),
      icon: <IoChatboxEllipsesSharp className="sidebar-icon" />,
    },
    {
      to: "/events",
      label: t("sidebar.events"),
      icon: <BiCalendar className="sidebar-icon" />,
    },
    ...(canModerate
      ? [
          {
            to: "/moderation",
            label: t("sidebar.moderation"),
            icon: <BiShieldQuarter className="sidebar-icon" />,
          },
        ]
      : []),
  ];

  const mobileCountClass = `sidebar-list--count-${navItems.length}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-wrapper">
        <nav className="sidebar-nav">
          <ul className={`sidebar-list ${mobileCountClass}`}>
            {navItems.map((item) => (
              <li key={item.to} className="sidebar-list-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <hr className="sidebar-hr" />

        <div className="sidebar-friends-block">
          <div className="sidebar-section-title">{t("sidebar.friends")}</div>

          <ul className="sidebar-friends-list">
            {loading && <li className="sidebar-status">{t("sidebar.loadingFriends")}</li>}
            {Boolean(error) && (
              <li className="sidebar-status">{t("sidebar.errorLoadingFriends")}</li>
            )}
            {!loading &&
              !error &&
              friends.map((friend) => (
                <FriendsList key={friend.id} friend={friend} />
              ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;