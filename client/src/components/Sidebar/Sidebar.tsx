import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
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

  const { data: friends, loading, error } = useFriends(
    typeof user?.id === "number" ? user.id : undefined
  );

  const role = (user as any)?.role;
  const canModerate =
    role === "MODERATOR" || role === "ADMIN" || role === "OWNER";

  const navItems = [
    {
      to: "/",
      label: "Home",
      icon: <SiFeedly className="sidebar-icon" />,
    },
    {
      to: "/explore",
      label: "Explore",
      icon: <BiCompass className="sidebar-icon" />,
    },
    {
      to: "/shorts",
      label: "Videos",
      icon: <BiSolidVideos className="sidebar-icon" />,
    },
    {
      to: "/chat",
      label: "Chat",
      icon: <IoChatboxEllipsesSharp className="sidebar-icon" />,
    },
    {
      to: "/events",
      label: "Events",
      icon: <BiCalendar className="sidebar-icon" />,
    },
    ...(canModerate
      ? [
          {
            to: "/moderation",
            label: "Moderation",
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
          <div className="sidebar-section-title">Friends</div>

          <ul className="sidebar-friends-list">
            {loading && <li className="sidebar-status">Loading...</li>}
            {Boolean(error) && (
              <li className="sidebar-status">Error loading friends</li>
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