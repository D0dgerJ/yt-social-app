import { Paperclip } from "lucide-react";
import React, { useRef } from "react";

interface FilePickerProps {
  onSelect: (file: File) => void;
}

const MAX_FILE_SIZE_MB = 25;

const FilePicker: React.FC<FilePickerProps> = ({ onSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      // 📸 Изображения
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',

      // 📄 Документы
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      // 📦 Архивы
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',

      // 📄 Текст
      'text/plain',
      'text/csv',
      'text/html',
      'text/css',
      'application/javascript',
      'application/x-typescript',
      'application/json',

      // 🎵 Аудио
      'audio/mpeg',

      // 🎥 Видео
      'video/mp4',
      'video/x-matroska',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Этот тип файла не поддерживается!');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Файл слишком большой. Максимальный размер — ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    onSelect(file);
    };

  return (
    <>
      <button onClick={handleClick} className="file-picker-button" title="Прикрепить файл">
        <Paperclip size={20} />
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={handleChange}
        accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.mp3,.mp4,.avi,.mkv,.csv,.xlsx,.json,.xml,.html,.css,.js,.ts"
      />
    </>
  );
};

export default FilePicker;
