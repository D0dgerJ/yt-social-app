import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import type { EmojiClickData } from "emoji-picker-react";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

type Props = {
  open: boolean;
  onToggle(): void;
  onPick(emoji: string): void;
};

const EmojiPickerWrapper: React.FC<Props> = ({ open, onToggle, onPick }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onToggle();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onToggle]);

  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return (
    <div className="upload-post__emoji-picker" ref={rootRef}>
      <Suspense fallback={null}>
        <EmojiPicker
          onEmojiClick={(data: EmojiClickData) => onPick(data.emoji)}
          lazyLoadEmojis
          width={320}
        />
      </Suspense>
    </div>
  );
};

export default EmojiPickerWrapper;
