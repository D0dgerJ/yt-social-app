import React, { useState } from "react";
import { EventDTO } from "../../utils/api/event.api";
import type { Holiday } from "./holidays";
import "./DayEventsModal.scss";

type Props = {
  isOpen: boolean;
  dateLabel: string;
  holidays: Holiday[];
  events: EventDTO[];
  onClose: () => void;
  onCreate: () => void;
  onUpdate: (
    eventId: number,
    data: { title: string; description?: string; color?: string }
  ) => void;
  onDelete: (eventId: number) => void;
};

const DayEventsModal: React.FC<Props> = ({
  isOpen,
  dateLabel,
  holidays,
  events,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2f54eb");

  if (!isOpen) return null;

  const startEdit = (e: EventDTO) => {
    setEditingId(e.id);
    setTitle(e.title);
    setDescription(e.description ?? "");
    setColor(e.color ?? "#2f54eb");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setColor("#2f54eb");
  };

  const saveEdit = () => {
    if (!editingId) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    onUpdate(editingId, {
      title: cleanTitle,
      description: description.trim() || undefined,
      color,
    });

    setEditingId(null);
  };

  const hasAny = holidays.length > 0 || events.length > 0;

  return (
    <div className="day-modal-overlay" onMouseDown={onClose}>
      <div className="day-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="day-modal-header">
          <div>
            <h3>События</h3>
            <div className="day-modal-date">{dateLabel}</div>
          </div>
          <button onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="day-modal-content">
          {!hasAny && (
            <div className="day-modal-empty">В этот день пока нет событий</div>
          )}

          {holidays.length > 0 && (
            <div className="day-section">
              <div className="day-section-title">Праздники</div>

              <div className="day-holidays-list">
                {holidays.map((h) => (
                  <div
                    key={h.key}
                    className="day-holiday-card"
                    style={{ borderLeftColor: h.color ?? "#16a34a" }}
                    title={h.title}
                  >
                    <div className="day-holiday-left">
                      <div className="day-holiday-title">
                        {h.icon ? <span className="day-holiday-icon">{h.icon}</span> : null}
                        <span>{h.title}</span>
                      </div>
                      <div className="day-holiday-note">Системный праздник</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="day-section">
              <div className="day-section-title">Мои события</div>

              <div className="day-events-list">
                {events.map((e) => (
                  <div key={e.id} className="day-event-card">
                    {editingId === e.id ? (
                      <>
                        <input
                          value={title}
                          onChange={(ev) => setTitle(ev.target.value)}
                          placeholder="Название"
                        />
                        <textarea
                          value={description}
                          onChange={(ev) => setDescription(ev.target.value)}
                          placeholder="Описание"
                        />

                        <div className="day-edit-row">
                          <label className="day-color-label">
                            Цвет
                            <input
                              type="color"
                              value={color}
                              onChange={(ev) => setColor(ev.target.value)}
                            />
                          </label>
                        </div>

                        <div className="actions">
                          <button onClick={saveEdit}>Сохранить</button>
                          <button onClick={cancelEdit}>Отмена</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="event-title" style={{ color: e.color ?? "#2f54eb" }}>
                          {e.title}
                        </div>
                        {e.description && <div className="event-desc">{e.description}</div>}

                        <div className="actions">
                          <button onClick={() => startEdit(e)}>Редактировать</button>
                          <button onClick={() => onDelete(e.id)}>Удалить</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && holidays.length > 0 && (
            <div className="day-modal-empty day-modal-empty--small">
              В этот день нет ваших событий — можно добавить своё.
            </div>
          )}
        </div>

        <div className="day-modal-footer">
          <button className="primary" onClick={onCreate}>
            + Добавить событие
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEventsModal;