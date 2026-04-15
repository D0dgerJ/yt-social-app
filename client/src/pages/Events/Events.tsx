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
              Здесь будут отображаться твои события, напоминания и заметки.
              Сейчас доступен календарь, а позже добавим записи и планирование по дням.
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
