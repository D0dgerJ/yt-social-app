import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Rightbar from "../../components/Rightbar/Rightbar";
import ShortsFeed from "../../components/ShortsFeed/ShortsFeed";
import "./Shorts.scss";

const Shorts: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="layout">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="shorts-wrapper">
          <ShortsFeed />
        </div>
        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default Shorts;
