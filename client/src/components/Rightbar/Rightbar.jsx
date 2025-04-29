import React, { useContext, useEffect, useState } from "react";
import birthdayIcon from "../../assets/gift.png";
import adImage from "../../assets/ad.jpg";
import profilePic from "./assets/no-profile-image.png";
import OnlineUsers from "../OnlineUsers/OnlineUsers";
import { Users } from "../../data/dummyData";
import { followUser, getUserFriends, unfollowUser } from "../../utils/api/api";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import "./Rightbar.scss";

const Rightbar = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    if (currentUser?.followings && user?._id) {
      setIsFollowed(currentUser.followings.includes(user._id));
    }
  }, [currentUser, user]);

  useEffect(() => {
    const getFriends = async () => {
      if (user?._id) {
        try {
          const res = await getUserFriends(user._id);
          setFriends(res.data.friends);
        } catch (error) {
          console.log(error);
        }
      }
    };
    getFriends();
  }, [user?._id]);

  const handleFollow = async () => {
    try {
      if (isFollowed) {
        await unfollowUser(user._id);
        dispatch({ type: "UNFOLLOW", payload: user._id });
      } else {
        await followUser(user._id);
        dispatch({ type: "FOLLOW", payload: user._id });
      }
    } catch (error) {
      console.log(error);
    }
    setIsFollowed(!isFollowed);
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
        {Users.map((user) => (
          <OnlineUsers key={user.id} user={user} />
        ))}
      </ul>
    </>
  );

  const RightBarProfile = () => (
    <>
      {user.username !== currentUser?.username && (
        <button className="follow-button" onClick={handleFollow}>
          {isFollowed ? "Following" : "Follow"}
        </button>
      )}
      <h1 className="user-info-title">User Information</h1>
      <div className="user-info">
        <div className="info-item">
          <span>City:</span>
          <span>{user.city}</span>
        </div>
        <div className="info-item">
          <span>From:</span>
          <span>{user.from}</span>
        </div>
        <div className="info-item">
          <span>Relationship:</span>
          <span>
            {user.relationship === 1
              ? "Single"
              : user.relationship === 2
              ? "Married"
              : "It's Complicated"}
          </span>
        </div>
      </div>
      <h1 className="friends-title">Friends</h1>
      <div className="friends-grid">
        {friends.map((friend) => (
          <Link to={`/profile/${friend?.username}`} key={friend._id}>
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
