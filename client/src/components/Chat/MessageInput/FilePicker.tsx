import React, { useMemo, useRef } from "react";
import { Paperclip } from "lucide-react";
import { IMAGE_MIME, VIDEO_MIME, FILE_MIME, MAX_FILE_MB } from "@/constants/mime";
import { assertAllowed } from "@/utils/fileGuards";

interface FilePickerProps {
  onSelect: (files: File[]) => void;
  title?: string;
  disabled?: boolean;
  maxFiles?: number; 
  existingCount?: number;
}

const FilePicker: React.FC<FilePickerProps> = ({
  onSelect,
  title = "Прикрепить файл",
  disabled = false,
  maxFiles = 10,
  existingCount = 0,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useMemo(() => {
    const all = [...IMAGE_MIME, ...VIDEO_MIME, ...FILE_MIME];
    return Array.from(new Set(all.filter(Boolean))).join(",");
  }, []);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const fl = e.currentTarget.files;
    if (!fl?.length) return;

    const accepted: File[] = [];
    const issues: string[] = [];

    const remainingSlots = Math.max(0, maxFiles - existingCount);
    const limitedFiles = Array.from(fl).slice(0, remainingSlots);

    limitedFiles.forEach((f) => {
      const res = assertAllowed(f);
      if (!res.ok) {
        issues.push(`${f.name}: ${res.reason}`);
      } else {
        accepted.push(f);
      }
    });

    if (issues.length) {
      alert(issues.join("\n"));
    }

    if (accepted.length) {
      onSelect(accepted);
    }

    e.currentTarget.value = "";
  };

  const overLimit = existingCount >= maxFiles;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`file-picker-button ${disabled || overLimit ? "disabled" : ""}`}
        title={
          disabled
            ? "Недоступно"
            : overLimit
            ? `Можно прикрепить не более ${maxFiles} файлов`
            : title
        }
        aria-label={title}
        disabled={disabled || overLimit}
      >
        <Paperclip size={20} />
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        onChange={handleChange}
        accept={accept}
        disabled={disabled || overLimit}
      />
    </>
  );
};

export default FilePicker;
