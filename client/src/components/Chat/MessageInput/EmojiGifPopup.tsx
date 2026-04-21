import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import GifPicker from './GifPicker';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { insertAtCursor } from './insertAtCursor';
import { makeGifAttachment, type ExternalGifAttachment } from './gifAttachment';
import './EmojiGifPopup.scss';

type Tab = 'emoji' | 'gif';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  replyToId?: number;
  onAddGif: (gif: ExternalGifAttachment) => void;
  onTextInsert?: (text: string) => void;
}

const POPUP_WIDTH = 360;
const VIEWPORT_PAD = 12;

export const EmojiGifPopup: React.FC<Props> = ({
  textareaRef,
  replyToId,
  onAddGif,
  onTextInsert,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('emoji');
  const [style, setStyle] = useState<React.CSSProperties>({
    visibility: 'hidden',
  });

  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const btn = btnRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const popupWidth = Math.min(POPUP_WIDTH, viewportWidth - VIEWPORT_PAD * 2);

      let left = rect.right - popupWidth;
      if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
      if (left + popupWidth > viewportWidth - VIEWPORT_PAD) {
        left = viewportWidth - popupWidth - VIEWPORT_PAD;
      }

      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const openUpwards = spaceAbove >= 320 || spaceAbove > spaceBelow;

      const top = openUpwards
        ? Math.max(VIEWPORT_PAD, rect.top - 8)
        : Math.min(viewportHeight - VIEWPORT_PAD, rect.bottom + 8);

      setStyle({
        position: 'fixed',
        left,
        top,
        zIndex: 4000,
        width: popupWidth,
        maxHeight: openUpwards
          ? Math.min(560, spaceAbove - VIEWPORT_PAD)
          : Math.min(560, spaceBelow - VIEWPORT_PAD),
        transform: openUpwards ? 'translateY(-100%)' : 'none',
        visibility: 'visible',
      });
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        popupRef.current &&
        !popupRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const popup = open
    ? createPortal(
        <div className="composer__popup" ref={popupRef} style={style}>
          <div className="composer__popup-header">
            <button
              className={`composer__tab ${activeTab === 'emoji' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('emoji')}
              type="button"
            >
              Emoji
            </button>
            <button
              className={`composer__tab ${activeTab === 'gif' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('gif')}
              type="button"
            >
              GIF
            </button>
            <button
              className="composer__popup-close"
              onClick={() => setOpen(false)}
              type="button"
            >
              ✕
            </button>
          </div>

          {activeTab === 'emoji' && (
            <div className="composer__emoji-pane">
              <Picker
                data={data}
                previewPosition="none"
                onEmojiSelect={(e: any) => {
                  insertAtCursor(textareaRef, e.native);
                  onTextInsert?.(e.native);
                  setOpen(false);
                }}
              />
            </div>
          )}

          {activeTab === 'gif' && (
            <div className="composer__gif-pane">
              <GifPicker
                onSelect={(url) => {
                  try {
                    onAddGif(makeGifAttachment(url));
                    setOpen(false);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="composer__emoji-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Insert emoji or GIF"
      >
        😊
      </button>

      {popup}
    </>
  );
};