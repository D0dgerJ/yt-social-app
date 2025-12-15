import React, { useState } from "react";
import { EventDTO } from "../../utils/api/event.api";
import "./DayEventsModal.scss";

type Props = {
  isOpen: boolean;
  dateLabel: string;
  events: EventDTO[];
  onClose: () => void;
  onCreate: () => void;
  onUpdate: (eventId: number, data: { title: string; description?: string; color?: string }) => void;
  onDelete: (eventId: number) => void;
};

const DayEventsModal: React.FC<Props> = ({
  isOpen,
  dateLabel,
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

  const saveEdit = () => {
    if (!editingId) return;
    onUpdate(editingId, {
      title: title.trim(),
      description: description.trim() || undefined,
      color,
    });
    setEditingId(null);
  };

  return (
    <div className="day-modal-overlay" onMouseDown={onClose}>
      <div className="day-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="day-modal-header">
          <div>
            <h3>События</h3>
            <div className="day-modal-date">{dateLabel}</div>
          </div>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="day-modal-content">
          {events.length === 0 && (
            <div className="day-modal-empty">В этот день пока нет событий</div>
          )}

          {events.map((e) => (
            <div key={e.id} className="day-event-card">
              {editingId === e.id ? (
                <>
                  <input value={title} onChange={(ev) => setTitle(ev.target.value)} />
                  <textarea value={description} onChange={(ev) => setDescription(ev.target.value)} />
                  <input type="color" value={color} onChange={(ev) => setColor(ev.target.value)} />

                  <div className="actions">
                    <button onClick={saveEdit}>Сохранить</button>
                    <button onClick={() => setEditingId(null)}>Отмена</button>
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