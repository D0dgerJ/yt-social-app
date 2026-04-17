import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { SiFeedly } from "react-icons/si";
import {
  BiSolidVideos,
  BiCalendar,
  BiCompass,
  BiShieldQuarter,
} from "react-icons/bi";
import { MdGroups } from "react-icons/md";
import { IoChatboxEllipsesSharp, IoBookmarks } from "react-icons/io5";

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
    /*{
      to: "/groups",
      label: "Groups",
      icon: <MdGroups className="sidebar-icon" />,
    },*/
    {
      to: "/chat",
      label: "Chat",
      icon: <IoChatboxEllipsesSharp className="sidebar-icon" />,
    },
    /*{
      to: "/bookmarks",
      label: "Bookmarks",
      icon: <IoBookmarks className="sidebar-icon" />,
    },*/
    {
      to: "/events",
      label: "Events",
      icon: <BiCalendar className="sidebar-icon" />,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-wrapper">
        <nav className="sidebar-nav">
          <ul className="sidebar-list">
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

            {canModerate && (
              <li className="sidebar-list-item">
                <NavLink
                  to="/moderation"
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <BiShieldQuarter className="sidebar-icon" />
                  <span>Moderation</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="sidebar-button">
          <button type="button">See More</button>
        </div>

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