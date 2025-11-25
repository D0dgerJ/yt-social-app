import React, { useMemo, useState } from "react";
import "./Calendar.scss";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type ViewDate = {
  year: number;
  month: number;
};

const getToday = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
  };
};

const generateMonthGrid = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1);
  const jsDay = firstDay.getDay(); 
  const startOffset = (jsDay + 6) % 7; 

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayIndex = i - startOffset + 1;
    if (dayIndex < 1 || dayIndex > daysInMonth) {
      cells.push({ day: null });
    } else {
      cells.push({ day: dayIndex });
    }
  }

  return { cells, daysInMonth, startOffset, totalCells };
};

const Calendar: React.FC = () => {
  const today = useMemo(() => getToday(), []);
  const [viewDate, setViewDate] = useState<ViewDate>({
    year: today.year,
    month: today.month,
  });

  const { year, month } = viewDate;

  const { cells } = useMemo(
    () => generateMonthGrid(year, month),
    [year, month]
  );

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: newMonth };
    });
  };

  const formatMonthTitle = (year: number, month: number) => {
    return new Date(year, month, 1).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
    });
  };

  const classifyDay = (day: number | null): "past" | "today" | "future" | "empty" => {
    if (day == null) return "empty";

    const isSameYear = year === today.year;
    const isSameMonth = month === today.month;

    if (isSameYear && isSameMonth) {
      if (day < today.day) return "past";
      if (day === today.day) return "today";
      return "future";
    }

    if (year < today.year) return "past";
    if (year > today.year) return "future";
    if (month < today.month) return "past";
    if (month > today.month) return "future";

    return "future";
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-button"
          onClick={handlePrevMonth}
        >
          ‹
        </button>

        <div className="calendar-title">
          {formatMonthTitle(year, month)}
        </div>

        <button
          type="button"
          className="calendar-nav-button"
          onClick={handleNextMonth}
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell, index) => {
          const status = classifyDay(cell.day);
          const isEmpty = status === "empty";

          return (
            <div
              key={index}
              className={[
                "calendar-day",
                `calendar-day--${status}`,
                isEmpty ? "calendar-day--empty" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {!isEmpty && <span className="calendar-day-number">{cell.day}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
