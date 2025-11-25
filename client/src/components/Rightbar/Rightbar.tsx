import React, { useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import useFriends from "../../hooks/useFriends";
import useOnlineUsers from "../../hooks/useOnlineUsers";
import RightBarHome from "./RightBarHome";
import RightBarProfile from "./RightBarProfile";
import "./Rightbar.scss";

interface Friend {
  id: number;
  username: string;
  profilePicture: string;
}

interface User {
  id: number;
  username: string;
  city?: string;
  from?: string;
  relationship?: number;
  profilePicture?: string;
  followings?: number[];
}

interface RightbarProps {
  user?: User;
}

const Rightbar: React.FC<RightbarProps> = ({ user }) => {
  const { user: currentUser } = useContext(AuthContext);

  const targetId = user?.id ?? currentUser?.id;
  const {
    data: friends = [],
    loading: friendsLoading,
    error: friendsError,
  } = useFriends(typeof targetId === "number" ? targetId : undefined);

  const onlineUserIds = useOnlineUsers();

  const onlineFriends = useMemo<Friend[]>(
    () =>
      (friends as Friend[]).filter((f) =>
        onlineUserIds.includes(f.id)
      ),
    [friends, onlineUserIds]
  );

  return (
    <div className="rightbar">
      <div className="rightbar-wrapper">
        {user ? (
          <RightBarProfile user={user} friends={friends as Friend[]} />
        ) : (
          <RightBarHome
            friends={onlineFriends}
            loading={friendsLoading}
            error={!!friendsError}
          />
        )}
      </div>
    </div>
  );
};

export default Rightbar;
