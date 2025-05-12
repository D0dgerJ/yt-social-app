import React, { useContext, useEffect, useState } from "react";
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
import { getUserFriends } from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import "./Sidebar.scss";

interface FriendType {
  id: number;
  username: string;
  profilePicture: string;
}

const Sidebar: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState<FriendType[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        if (user?.id) {
          const data = await getUserFriends(user.id);
          setFriends(data);
        }
      } catch (error) {
        console.error("Failed to fetch friends", error);
      }
    };

    fetchFriends();
  }, [user?.id]);

  return (
    <div className="sidebar">
      <div className="sidebar-wrapper">
        <ul className="sidebar-list">
          <li className="sidebar-list-item">
            <SiFeedly className="sidebar-icon" />
            <span>Feeds</span>
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
            <IoChatboxEllipsesSharp className="sidebar-icon" />
            <span>Chat</span>
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
            <IoBriefcase className="sidebar-icon" />
            <span>Jobs</span>
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
          {friends.map((friend) => (
            <FriendsList key={friend.id} friend={friend} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
