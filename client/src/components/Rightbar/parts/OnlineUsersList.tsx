import React from "react";
import { useTranslation } from "react-i18next";
import OnlineUsers from "../../OnlineUsers/OnlineUsers";

type Friend = {
  id: number;
  username: string;
  profilePicture: string;
};

interface OnlineUsersListProps {
  friends: Friend[];
  loading?: boolean;
  error?: boolean;
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  friends,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <ul className="online-users">
      {loading && <li className="rightbar-status">{t("common.loading")}</li>}
      {error && <li className="rightbar-status">{t("rightbar.failedToLoadFriends")}</li>}
      {!loading && !error && friends.length === 0 && (
        <li className="rightbar-empty">{t("rightbar.noOneOnline")}</li>
      )}

      {friends.map((friend) => (
        <OnlineUsers key={friend.id} user={friend} />
      ))}
    </ul>
  );
};

export default OnlineUsersList;