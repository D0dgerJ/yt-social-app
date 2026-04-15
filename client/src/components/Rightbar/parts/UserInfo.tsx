import React from "react";

type User = {
  city?: string;
  from?: string;
  relationship?: number;
};

const relToText = (r?: number) =>
  r === 1 ? "Single" : r === 2 ? "Married" : "It's Complicated";

const UserInfo: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="user-info">
      <div className="info-item">
        <span className="info-label">City</span>
        <span className="info-value">{user?.city || "—"}</span>
      </div>

      <div className="info-item">
        <span className="info-label">From</span>
        <span className="info-value">{user?.from || "—"}</span>
      </div>

      <div className="info-item">
        <span className="info-label">Relationship</span>
        <span className="info-value">{relToText(user?.relationship)}</span>
      </div>
    </div>
  );
};

export default UserInfo;