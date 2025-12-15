import React, { useState } from "react";
import "./CreateEventModal.scss";

type Props = {
  isOpen: boolean;
  dateLabel: string;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; color?: string }) => void;
};

const CreateEventModal: React.FC<Props> = ({ isOpen, dateLabel, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2f54eb");

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    onSubmit({
      title: cleanTitle,
      description: description.trim() || undefined,
      color,
    });

    setTitle("");
    setDescription("");
    setColor("#2f54eb");
  };

  return (
    <div className="event-modal-overlay" onMouseDown={onClose}>
      <div className="event-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <div className="event-modal-title">Добавить событие</div>
          <button className="event-modal-close" onClick={onClose} type="button">✕</button>
        </div>

        <div className="event-modal-date">{dateLabel}</div>

        <label className="event-modal-label">
          Название
          <input
            className="event-modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: день рождения"
          />
        </label>

        <label className="event-modal-label">
          Описание (опционально)
          <textarea
            className="event-modal-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: купить торт"
          />
        </label>

        <label className="event-modal-label">
          Цвет
          <input
            className="event-modal-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>

        <div className="event-modal-actions">
          <button className="event-modal-btn event-modal-btn--secondary" onClick={onClose} type="button">
            Отмена
          </button>
          <button className="event-modal-btn event-modal-btn--primary" onClick={handleSave} type="button" disabled={!title.trim()}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
