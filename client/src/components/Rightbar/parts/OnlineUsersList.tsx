import React from "react";
import OnlineUsers from "../../OnlineUsers/OnlineUsers";

type Friend = {
  id: number;
  username: string;
  profilePicture: string;
};

type Props = {
  friends: Friend[];
  loading?: boolean;
  error?: boolean;
};

const OnlineUsersList: React.FC<Props> = ({ friends, loading, error }) => {
  return (
    <ul className="online-users">
      {loading && <li>Loading...</li>}
      {error && <li>Failed to load friends</li>}
      {friends.map((f) => (
        <OnlineUsers key={f.id} user={f} />
      ))}
    </ul>
  );
};

export default OnlineUsersList;
