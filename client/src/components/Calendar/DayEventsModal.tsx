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

const buildWikiUrl = (h: Holiday) => {
  if (h.wiki) return h.wiki;

  const q = encodeURIComponent(h.title);
  return `https://ru.wikipedia.org/w/index.php?search=${q}`;
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
            <h3>Events</h3>
            <div className="day-modal-date">{dateLabel}</div>
          </div>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="day-modal-content">
          {!hasAny && (
            <div className="day-modal-empty">There are no events on this day yet</div>
          )}

          {holidays.length > 0 && (
            <div className="day-section">
              <div className="day-section-title">Holidays</div>

              <div className="day-holidays-list">
                {holidays.map((h) => {
                  const url = buildWikiUrl(h);

                  return (
                    <a
                      key={h.key}
                      className="day-holiday-card day-holiday-card--link"
                      style={{ borderLeftColor: h.color ?? "#16a34a" }}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in Wikipedia"
                      onMouseDown={(e) => e.stopPropagation()} 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="day-holiday-left">
                        <div className="day-holiday-title">
                          {h.icon ? (
                            <span className="day-holiday-icon">{h.icon}</span>
                          ) : null}
                          <span>{h.title}</span>
                        </div>
                        <div className="day-holiday-note">
                          System holiday • Wikipedia
                        </div>
                      </div>

                      <div className="day-holiday-open" aria-hidden="true">
                        ↗
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {events.length > 0 && (
            <div className="day-section">
              <div className="day-section-title">My events</div>

              <div className="day-events-list">
                {events.map((e) => (
                  <div key={e.id} className="day-event-card">
                    {editingId === e.id ? (
                      <>
                        <input
                          value={title}
                          onChange={(ev) => setTitle(ev.target.value)}
                          placeholder="Title"
                        />
                        <textarea
                          value={description}
                          onChange={(ev) => setDescription(ev.target.value)}
                          placeholder="Description"
                        />

                        <div className="day-edit-row">
                          <label className="day-color-label">
                            Color
                            <input
                              type="color"
                              value={color}
                              onChange={(ev) => setColor(ev.target.value)}
                            />
                          </label>
                        </div>

                        <div className="actions">
                          <button onClick={saveEdit}>Save</button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="event-title"
                          style={{ color: e.color ?? "#2f54eb" }}
                        >
                          {e.title}
                        </div>
                        {e.description && (
                          <div className="event-desc">{e.description}</div>
                        )}

                        <div className="actions">
                          <button onClick={() => startEdit(e)}>
                            Edit
                          </button>
                          <button onClick={() => onDelete(e.id)}>Delete</button>
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
              There are no personal events on this day yet — you can add one.
            </div>
          )}
        </div>

        <div className="day-modal-footer">
          <button className="primary" onClick={onCreate}>
            + Add event
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEventsModal;