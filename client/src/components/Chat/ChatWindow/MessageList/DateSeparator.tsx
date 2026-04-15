import React from "react";
import "./MessageList.scss";

export const DateSeparator: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div className="msg-separator">
      <span className="msg-separator__label">{label}</span>
    </div>
  );
};