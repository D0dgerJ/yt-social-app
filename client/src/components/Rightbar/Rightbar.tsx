import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import useFriends from "../../hooks/useFriends";
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
    data: friends,
    loading: friendsLoading,
    error: friendsError,
  } = useFriends(typeof targetId === "number" ? targetId : undefined);

  return (
    <div className="rightbar">
      <div className="rightbar-wrapper">
        {user ? (
          <RightBarProfile user={user} friends={friends as Friend[]} />
        ) : (
          <RightBarHome
            friends={friends as Friend[]}
            loading={friendsLoading}
            error={!!friendsError}
          />
        )}
      </div>
    </div>
  );
};

export default Rightbar;
