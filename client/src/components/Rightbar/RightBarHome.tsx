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
      <section className="rightbar-card rightbar-card--compact">
        <div className="birthday-section">
          <img src={birthdayIcon} alt="Birthday" className="birthday-icon" />
          <div className="birthday-content">
            <div className="section-title-sm">Highlights</div>
            <p className="birthday-text">
              Проверь, кто сегодня онлайн, и не пропусти новые активности.
            </p>
          </div>
        </div>
      </section>

      <section className="rightbar-card rightbar-card--media">
        <img src={adImage} alt="Advert" className="advert-image" />
      </section>

      <section className="rightbar-card">
        <div className="rightbar-section-header">
          <h3 className="rightbar-title">Online</h3>
          <span className="rightbar-counter">{friends.length}</span>
        </div>

        <OnlineUsersList friends={friends} loading={loading} error={error} />
      </section>
    </>
  );
};

export default RightBarHome;