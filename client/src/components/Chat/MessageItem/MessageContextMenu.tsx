import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './MessageContextMenu.scss';

type Item = {
  key: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
};

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  items: Item[];
};

const MessageContextMenu: React.FC<Props> = ({ x, y, onClose, items }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ left: x, top: y });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { offsetWidth, offsetHeight } = el;
    const newLeft =
      x + offsetWidth > window.innerWidth ? window.innerWidth - offsetWidth - 10 : x;
    const newTop =
      y + offsetHeight > window.innerHeight ? window.innerHeight - offsetHeight - 10 : y;
    setCoords({ left: Math.max(8, newLeft), top: Math.max(8, newTop) });
  }, [x, y, items.length]);

  return (
    <div
      ref={ref}
      className="msg-context-menu"
      style={{
        left: coords.left,
        top: coords.top,
        zIndex: 1000,
        position: 'fixed',
      }}
      tabIndex={-1}
    >
      {items.map((i) => (
        <button
          key={i.key}
          className={`msg-context-menu__item ${i.danger ? 'is-danger' : ''}`}
          onClick={() => {
            i.onClick();
            onClose();
          }}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
};

export default MessageContextMenu;
