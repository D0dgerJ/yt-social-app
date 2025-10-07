import React from 'react';
import './MessageList.scss';

export const SystemMessage: React.FC<{ text: string; time?: string }> = ({ text, time }) => {
  return (
    <div className="msg-system">
      <span className="msg-system__text">{text}</span>
      {time && <time className="msg-system__time">{new Date(time).toLocaleTimeString()}</time>}
    </div>
  );
};