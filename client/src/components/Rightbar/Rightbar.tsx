import React, { useContext, useEffect, useState, memo } from "react";
import birthdayIcon from "../../assets/gift.png";
import adImage from "../../assets/ad.jpg";
import profilePic from "./assets/no-profile-image.png";
import OnlineUsers from "../OnlineUsers/OnlineUsers";
import { followUser, unfollowUser } from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import useFriends from "../../hooks/useFriends";
import "./Rightbar.scss";

interface Friend {
  id: number;
  username: string;
  profilePicture?: string;
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
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const [isFollowed, setIsFollowed] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const targetId = user?.id ?? currentUser?.id;
  const {
    data: friends,
    loading: friendsLoading,
    error: friendsError,
  } = useFriends(typeof targetId === "number" ? targetId : undefined);

  useEffect(() => {
    if (currentUser?.followings && user?.id) {
      setIsFollowed(currentUser.followings.includes(user.id));
    } else {
      setIsFollowed(false);
    }
  }, [currentUser?.followings, user?.id]);

  const handleFollow = async () => {
    if (!user?.id || loadingFollow) return;
    setLoadingFollow(true);

    try {
      if (isFollowed) {
        await unfollowUser(user.id);
        dispatch({ type: "UNFOLLOW", payload: user.id });
      } else {
        await followUser(user.id);
        dispatch({ type: "FOLLOW", payload: user.id });
      }
      setIsFollowed((s) => !s);
    } catch (error) {
      console.error("Failed to follow/unfollow", error);
    } finally {
      setLoadingFollow(false);
    }
  };

  return (
    <div className="rightbar">
      <div className="rightbar-wrapper">
        {user ? (
          <RightBarProfile
            user={user}
            currentUsername={currentUser?.username}
            isFollowed={isFollowed}
            onToggleFollow={handleFollow}
            loadingFollow={loadingFollow}
            friends={friends}
          />
        ) : (
          <RightBarHome
            friends={friends}
            loading={friendsLoading}
            error={!!friendsError}
          />
        )}
      </div>
    </div>
  );
};

export default Rightbar;


const RightBarHome = memo(function RightBarHome(props: {
  friends: Friend[];
  loading: boolean;
  error: boolean;
}) {
  const { friends, loading, error } = props;

  return (
    <>
      <div className="birthday-section">
        <img src={birthdayIcon} alt="Birthday" className="birthday-icon" />
        <span>
          <b>Henry Crentsil</b> and <b>52 others</b> have a birthday today
        </span>
      </div>

      <img src={adImage} alt="Advert" className="advert-image" />

      <h1 className="online-title">Online</h1>
      <ul className="online-users">
        {loading && <li>Loading...</li>}
        {error && <li>Failed to load friends</li>}
        {friends.map((f) => (
          <OnlineUsers key={f.id} user={f} />
        ))}
      </ul>
    </>
  );
});

const RightBarProfile = memo(function RightBarProfile(props: {
  user: User;
  currentUsername?: string;
  isFollowed: boolean;
  loadingFollow: boolean;
  onToggleFollow: () => void;
  friends: Friend[];
}) {
  const {
    user,
    currentUsername,
    isFollowed,
    loadingFollow,
    onToggleFollow,
    friends,
  } = props;

  return (
    <>
      {user?.username !== currentUsername && (
        <button
          className="follow-button"
          onClick={onToggleFollow}
          disabled={loadingFollow}
        >
          {isFollowed ? "Following" : "Follow"}
        </button>
      )}

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
          <span>
            {user?.relationship === 1
              ? "Single"
              : user?.relationship === 2
              ? "Married"
              : "It's Complicated"}
          </span>
        </div>
      </div>

      <h1 className="friends-title">Friends</h1>
      <div className="friends-grid">
        {friends.map((friend) => (
          <Link to={`/profile/${friend.username}`} key={friend.id}>
            <div className="friend-card">
              <img
                src={friend.profilePicture || profilePic}
                alt="Friend"
                className="friend-img"
              />
              <span>{friend.username}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
});
