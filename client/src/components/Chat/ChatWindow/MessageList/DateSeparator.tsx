import React from 'react';
import './MessageList.scss';

export const DateSeparator: React.FC<{ label: string }> = ({ label }) => {
  return <div className="msg-separator">{label}</div>;
};