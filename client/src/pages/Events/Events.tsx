import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Rightbar from "../../components/Rightbar/Rightbar";
import Calendar from "../../components/Calendar/Calendar";
import "./Events.scss";

const Events: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="layout">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <div className="events-wrapper">
          <h2 className="events-title">Events</h2>
          <p className="events-subtitle">
            Здесь будут отображаться твои события, напоминания и заметки. Пока что —
            только календарь, но позже мы добавим записи по дням.
          </p>

          <Calendar />
        </div>

        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default Events;
