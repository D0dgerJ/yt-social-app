import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import Rightbar from "../../components/Rightbar/Rightbar";
import "./Home.scss";

interface HomeProps {
  feedMode?: "home" | "explore";
}

const Home: React.FC<HomeProps> = ({ feedMode = "home" }) => {
  return (
    <>
      <Navbar />
      <div className="layout">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>
        <div className="newsfeed-wrapper">
          <NewsFeed mode={feedMode} />
        </div>
        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default Home;