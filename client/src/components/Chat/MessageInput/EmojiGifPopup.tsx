import React, { useEffect, useMemo, useRef, useState } from 'react';
import GifPicker from './GifPicker';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { insertAtCursor } from './insertAtCursor';
import { useGifSender } from './useGifSender';
import './EmojiGifPopup.scss';

type Tab = 'emoji' | 'gif';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  replyToId?: number;
}

export const EmojiGifPopup: React.FC<Props> = ({ textareaRef, replyToId }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('emoji');
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const { sendGif } = useGifSender(replyToId);

  const style = useMemo<React.CSSProperties>(() => {
    const btn = btnRef.current;
    if (!btn) return { display: 'none' };

    const rect = btn.getBoundingClientRect();

    const pad = 8;
    const left = Math.min(
        Math.max(pad, rect.left),
        window.innerWidth - 360 - pad
    );

    const bottom = Math.max(pad, window.innerHeight - rect.bottom + pad);

    return { position: 'fixed', left, bottom, zIndex: 1000 };
    }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popupRef.current && !popupRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="composer__emoji-btn"
        onClick={() => setOpen(v => !v)}
      >
        😊
      </button>

      {open && (
        <div className="composer__popup" ref={popupRef} style={style}>
          <div className="composer__popup-header">
            <button
              className={`composer__tab ${activeTab === 'emoji' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('emoji')}
            >
              Emoji
            </button>
            <button
              className={`composer__tab ${activeTab === 'gif' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('gif')}
            >
              GIF
            </button>
            <button
              className="composer__popup-close"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          {activeTab === 'emoji' && (
            <Picker
                data={data}
                onEmojiSelect={(e: any) => {
                insertAtCursor(textareaRef, e.native);
                setOpen(false);
                }}
                previewPosition="none"
            />
            )}

          {activeTab === 'gif' && (
            <GifPicker onSelect={(url) => { sendGif(url); setOpen(false); }} />
          )}
        </div>
      )}
    </>
  );
};
