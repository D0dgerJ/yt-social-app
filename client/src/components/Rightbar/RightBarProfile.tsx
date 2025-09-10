import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { followUser, unfollowUser } from "../../utils/api/user.api";
import FollowButton from "./parts/FollowButton";
import UserInfo from "./parts/UserInfo";
import FriendsGrid from "./parts/FriendsGrid";
import profilePic from "./assets/no-profile-image.png";

type Friend = {
  id: number;
  username: string;
  profilePicture: string;
};

type User = {
  id: number;
  username: string;
  city?: string;
  from?: string;
  relationship?: number;
  profilePicture?: string;
  followings?: number[];
};

type Props = {
  user: User;
  friends: Friend[];
};

const RightBarProfile: React.FC<Props> = ({ user, friends }) => {
  const { user: currentUser, dispatch } = useContext(AuthContext);

  const [isFollowed, setIsFollowed] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  useEffect(() => {
    if (currentUser?.followings && user?.id) {
      setIsFollowed(currentUser.followings.includes(user.id));
    } else {
      setIsFollowed(false);
    }
  }, [currentUser?.followings, user?.id]);

  const handleFollowToggle = async () => {
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
    } catch (e) {
      console.error("Failed to follow/unfollow", e);
    } finally {
      setLoadingFollow(false);
    }
  };

  return (
    <>
      {user.username !== currentUser?.username && (
        <FollowButton
          className="follow-button"
          isFollowed={isFollowed}
          loading={loadingFollow}
          onClick={handleFollowToggle}
        />
      )}

      <UserInfo user={user} />

      <h1 className="friends-title">Friends</h1>
      <FriendsGrid friends={friends} fallbackAvatar={profilePic} />
    </>
  );
};

export default React.memo(RightBarProfile);
