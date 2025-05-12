import React, { useContext, useEffect, useState } from "react";
import birthdayIcon from "../../assets/gift.png";
import adImage from "../../assets/ad.jpg";
import profilePic from "./assets/no-profile-image.png";
import OnlineUsers from "../OnlineUsers/OnlineUsers";
import {
  followUser,
  getUserFriends,
  unfollowUser,
} from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.followings && user?.id) {
      setIsFollowed(currentUser.followings.includes(user.id));
    }
  }, [currentUser, user]);

  useEffect(() => {
    const getFriends = async () => {
      const targetId = user?.id ?? currentUser?.id;
      if (!targetId) return;

      try {
        const res = await getUserFriends(targetId);
        setFriends(res);
      } catch (error) {
        console.error("Failed to fetch friends", error);
      }
    };
    getFriends();
  }, [user?.id, currentUser?.id]);

  const handleFollow = async () => {
    if (!user?.id ) return;

    try {
      if (isFollowed) {
        await unfollowUser(user.id );
        dispatch({ type: "UNFOLLOW", payload: user.id  });
      } else {
        await followUser(user.id );
        dispatch({ type: "FOLLOW", payload: user.id  });
      }
      setIsFollowed(!isFollowed);
    } catch (error) {
      console.error("Failed to follow/unfollow", error);
    }
  };

  const RightBarHome = () => (
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
        {friends.map((user) => (
          <OnlineUsers key={user.id} user={user} />
        ))}
      </ul>
    </>
  );

  const RightBarProfile = () => (
    <>
      {user?.username !== currentUser?.username && (
        <button className="follow-button" onClick={handleFollow}>
          {isFollowed ? "Following" : "Follow"}
        </button>
      )}
      <h1 className="user-info-title">User Information</h1>
      <div className="user-info">
        <div className="info-item">
          <span>City:</span>
          <span>{user?.city}</span>
        </div>
        <div className="info-item">
          <span>From:</span>
          <span>{user?.from}</span>
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

  return (
    <div className="rightbar">
      <div className="rightbar-wrapper">
        {user ? <RightBarProfile /> : <RightBarHome />}
      </div>
    </div>
  );
};

export default Rightbar;
