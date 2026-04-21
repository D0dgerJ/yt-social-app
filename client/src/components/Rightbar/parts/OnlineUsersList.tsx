import React from "react";
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
  return (
    <ul className="online-users">
      {loading && <li className="rightbar-status">Loading...</li>}
      {error && <li className="rightbar-status">Failed to load friends</li>}
      {!loading && !error && friends.length === 0 && (
        <li className="rightbar-empty">No one is online right now</li>
      )}

      {friends.map((friend) => (
        <OnlineUsers key={friend.id} user={friend} />
      ))}
    </ul>
  );
};

export default OnlineUsersList;