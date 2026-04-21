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

        <main className="events-wrapper">
          <section className="events-hero">
            <h2 className="events-title">Events</h2>
            <p className="events-subtitle">
              Your events, reminders, and notes will appear here.
              The calendar is available now, and daily planning and entries will be added later.
            </p>
          </section>

          <Calendar />
        </main>

        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default Events;
