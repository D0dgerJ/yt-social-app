import React, { useMemo, useState, useEffect } from "react";
import "./Calendar.scss";
import { eventsApi, EventDTO } from "../../utils/api/event.api";
import CreateEventModal from "./CreateEventModal";
import DayEventsModal from "./DayEventsModal";
import { buildHolidayMapForYear } from "./holidays";

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

  return { cells };
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const makeISODateUTC = (year: number, month: number, day: number) => {
  return `${year}-${pad2(month + 1)}-${pad2(day)}T00:00:00.000Z`;
};

const monthRangeUTC = (year: number, month: number) => {
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0)).toISOString();
  return { from, to };
};

const formatDayLabel = (year: number, month: number, day: number) => {
  return new Date(year, month, day).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const Calendar: React.FC = () => {
  const today = useMemo(() => getToday(), []);
  const [viewDate, setViewDate] = useState<ViewDate>({
    year: today.year,
    month: today.month,
  });

  const { year, month } = viewDate;

  const { cells } = useMemo(() => generateMonthGrid(year, month), [year, month]);

  const [events, setEvents] = useState<EventDTO[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventDTO[]>();
    for (const e of events) {
      const key = e.startAt.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const holidaysByDay = useMemo(() => buildHolidayMapForYear(year), [year]);

  const selectedDayLabel =
    selectedDay == null ? "" : formatDayLabel(year, month, selectedDay);

  const selectedDayKey =
    selectedDay == null ? null : `${year}-${pad2(month + 1)}-${pad2(selectedDay)}`;

  const selectedDayEvents = useMemo(() => {
    if (!selectedDayKey) return [];
    return eventsByDay.get(selectedDayKey) ?? [];
  }, [eventsByDay, selectedDayKey]);

  const selectedDayHolidays = useMemo(() => {
    if (!selectedDayKey) return [];
    return holidaysByDay.get(selectedDayKey) ?? [];
  }, [holidaysByDay, selectedDayKey]);


  const reloadMonth = async () => {
    const { from, to } = monthRangeUTC(year, month);
    const res = await eventsApi.getRange(from, to);
    setEvents(res.data);
  };

  useEffect(() => {
    reloadMonth().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth < 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const newMonth = prev.month + 1;
      if (newMonth > 11) return { year: prev.year + 1, month: 0 };
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

  const openDay = (day: number) => {
    setSelectedDay(day);

    const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;

    const listEvents = eventsByDay.get(key) ?? [];
    const listHolidays = holidaysByDay.get(key) ?? [];

    if (listEvents.length === 0 && listHolidays.length === 0) {
      setIsCreateModalOpen(true);
      setIsDayModalOpen(false);
    } else {
      setIsDayModalOpen(true);
      setIsCreateModalOpen(false);
    }
  };

  const handleCreate = async (data: { title: string; description?: string; color?: string }) => {
    if (selectedDay == null) return;

    const startAt = makeISODateUTC(year, month, selectedDay);

    const res = await eventsApi.create({
      title: data.title,
      description: data.description,
      startAt,
      allDay: true,
      color: data.color,
    });

    setEvents((prev) => [...prev, res.data]);
    setIsCreateModalOpen(false);
  };

  const handleUpdate = async (
    eventId: number,
    data: { title: string; description?: string; color?: string }
  ) => {
    await eventsApi.update(eventId, {
      title: data.title,
      description: data.description,
      color: data.color,
    });

    await reloadMonth();
  };

  const handleDelete = async (eventId: number) => {
    await eventsApi.remove(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <>
      <div className="calendar">
        <div className="calendar-header">
          <button type="button" className="calendar-nav-button" onClick={handlePrevMonth}>
            ‹
          </button>

          <div className="calendar-title">{formatMonthTitle(year, month)}</div>

          <button type="button" className="calendar-nav-button" onClick={handleNextMonth}>
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

            const dayKey =
              cell.day == null ? null : `${year}-${pad2(month + 1)}-${pad2(cell.day)}`;

            const dayEvents = dayKey ? eventsByDay.get(dayKey) ?? [] : [];
            const dayHolidays = dayKey ? holidaysByDay.get(dayKey) ?? [] : [];

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
                onClick={() => {
                  if (isEmpty || cell.day == null) return;
                  openDay(cell.day);
                }}
                role={!isEmpty ? "button" : undefined}
                tabIndex={!isEmpty ? 0 : -1}
              >
                {!isEmpty && (
                  <>
                    <span className="calendar-day-number">{cell.day}</span>

                    {dayHolidays.length > 0 && (
                      <div className="calendar-holidays">
                        {dayHolidays.slice(0, 2).map((h) => (
                          <div
                            key={h.key}
                            className="calendar-holiday"
                            style={{ background: h.color ?? "#16a34a" }}
                            title={h.title}
                          >
                            {h.icon ? `${h.icon} ` : ""}
                            {h.title}
                          </div>
                        ))}

                        {dayHolidays.length > 2 && (
                          <div className="calendar-holiday calendar-holiday--more">
                            +{dayHolidays.length - 2}
                          </div>
                        )}
                      </div>
                    )}

                    {dayEvents.length > 0 && (
                      <div className="calendar-events">
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className="calendar-event"
                            style={{ background: e.color ?? "#2f54eb" }}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        ))}

                        {dayEvents.length > 3 && (
                          <div className="calendar-event calendar-event--more">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DayEventsModal
        isOpen={isDayModalOpen}
        dateLabel={selectedDayLabel}
        holidays={selectedDayHolidays}
        events={selectedDayEvents}
        onClose={() => setIsDayModalOpen(false)}
        onCreate={() => {
          setIsDayModalOpen(false);
          setIsCreateModalOpen(true);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <CreateEventModal
        isOpen={isCreateModalOpen}
        dateLabel={selectedDayLabel}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
};

export default Calendar;