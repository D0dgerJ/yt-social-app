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
    <>
      <h1 className="user-info-title">User Information</h1>
      <div className="user-info">
        <div className="info-item">
          <span>City:</span>
          <span>{user?.city || "—"}</span>
        </div>
        <div className="info-item">
          <span>From:</span>
          <span>{user?.from || "—"}</span>
        </div>
        <div className="info-item">
          <span>Relationship:</span>
          <span>{relToText(user?.relationship)}</span>
        </div>
      </div>
    </>
  );
};

export default UserInfo;
