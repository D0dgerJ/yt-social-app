import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { SiFeedly } from "react-icons/si";
import { BiSolidVideos } from "react-icons/bi";
import { MdGroups } from "react-icons/md";
import {
  IoChatboxEllipsesSharp,
  IoBookmarks,
  IoBriefcase,
} from "react-icons/io5";
import { BsFillQuestionSquareFill } from "react-icons/bs";
import { FaUserGraduate, FaCalendarDay } from "react-icons/fa";
import FriendsList from "../FriendsList/FriendsList";
import { AuthContext } from "../../context/AuthContext";
import useFriends from "../../hooks/useFriends";
import "./Sidebar.scss";

const Sidebar: React.FC = () => {
  const { user } = useContext(AuthContext);

  const { data: friends, loading, error } = useFriends(
    typeof user?.id === "number" ? user.id : undefined
  );

  return (
    <div className="sidebar">
      <div className="sidebar-wrapper">
        <ul className="sidebar-list">
          <li className="sidebar-list-item">
            <NavLink to="/" className="sidebar-link">
              <SiFeedly className="sidebar-icon" />
              <span>Feeds</span>
            </NavLink>
          </li>
          <li className="sidebar-list-item">
            <BiSolidVideos className="sidebar-icon" />
            <span>Videos</span>
          </li>
          <li className="sidebar-list-item">
            <MdGroups className="sidebar-icon" />
            <span>Groups</span>
          </li>
          <li className="sidebar-list-item">
            <NavLink to="/chat" className="sidebar-link">
              <IoChatboxEllipsesSharp className="sidebar-icon" />
              <span>Chat</span>
            </NavLink>
          </li>
          <li className="sidebar-list-item">
            <IoBookmarks className="sidebar-icon" />
            <span>Bookmarks</span>
          </li>
          <li className="sidebar-list-item">
            <BsFillQuestionSquareFill className="sidebar-icon" />
            <span>Questions</span>
          </li>
          <li className="sidebar-list-item">
            <FaUserGraduate className="sidebar-icon" />
            <span>Courses</span>
          </li>
          <li className="sidebar-list-item">
            <FaCalendarDay className="sidebar-icon" />
            <span>Events</span>
          </li>
        </ul>

        <div className="sidebar-button">
          <button>See More</button>
        </div>

        <hr className="sidebar-hr" />

        <ul className="sidebar-friends-list">
          {loading && <li>Loading...</li>}
          {Boolean(error) && <li>Error loading friends</li>}
          {friends.map((friend) => (
            <FriendsList key={friend.id} friend={friend} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
