import React from "react";
import birthdayIcon from "../../assets/gift.png";
import adImage from "../../assets/ad.jpg";
import OnlineUsersList from "./parts/OnlineUsersList";

type Friend = {
  id: number;
  username: string;
  profilePicture: string;
};

interface Props {
  friends: Friend[];
  loading?: boolean;
  error?: boolean;
}

const RightBarHome: React.FC<Props> = ({ friends, loading, error }) => {
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
      <OnlineUsersList friends={friends} loading={loading} error={error} />
    </>
  );
};

export default RightBarHome;
