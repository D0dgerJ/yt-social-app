import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

type Friend = {
  id: number;
  username: string;
  profilePicture?: string;
};

type Props = {
  friends: Friend[];
  fallbackAvatar: string;
};

const FriendsGrid: React.FC<Props> = ({ friends, fallbackAvatar }) => {
  const { t } = useTranslation();

  if (!friends.length) {
    return <div className="rightbar-empty">{t("rightbar.noFriendsYet")}</div>;
  }

  return (
    <div className="friends-grid">
      {friends.map((friend) => (
        <Link
          key={friend.id}
          to={`/profile/${friend.username}`}
          className="friend-link"
        >
          <div className="friend-card">
            <img
              src={friend.profilePicture || fallbackAvatar}
              alt={friend.username}
              className="friend-img"
            />
            <span className="friend-name">{friend.username}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FriendsGrid;