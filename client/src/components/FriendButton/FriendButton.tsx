import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { useFriendStatus } from "../../hooks/useFriendStatus";
import { AuthContext } from "../../context/AuthContext";
import "./FriendButton.scss";

interface FriendButtonProps {
  targetUserId: number;
}

const FriendButton: React.FC<FriendButtonProps> = ({ targetUserId }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();

  const {
    status,
    sendRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
  } = useFriendStatus({
    currentUserId: user?.id ?? -1,
    targetUserId,
  });

  if (!user || user.id === targetUserId) return null;

  if (!status) {
    return (
      <button type="button" className="friend-btn friend-btn--ghost" disabled>
        {t("friends.loading")}
      </button>
    );
  }

  switch (status) {
    case "friends":
      return (
        <button
          type="button"
          className="friend-btn friend-btn--secondary"
          onClick={cancelRequest}
        >
          {t("friends.removeFromFriends")}
        </button>
      );

    case "request_sent":
      return (
        <button
          type="button"
          className="friend-btn friend-btn--ghost"
          onClick={cancelRequest}
        >
          {t("friends.cancelRequest")}
        </button>
      );

    case "request_received":
      return (
        <div className="friend-btn-group">
          <button
            type="button"
            className="friend-btn friend-btn--primary"
            onClick={acceptRequest}
          >
            {t("friends.accept")}
          </button>
          <button
            type="button"
            className="friend-btn friend-btn--danger"
            onClick={rejectRequest}
          >
            {t("friends.decline")}
          </button>
        </div>
      );

    case "following":
      return (
        <button type="button" className="friend-btn friend-btn--ghost" disabled>
          {t("friends.following")}
        </button>
      );

    case "follower":
      return (
        <button
          type="button"
          className="friend-btn friend-btn--secondary"
          onClick={sendRequest}
        >
          {t("friends.followerAdd")}
        </button>
      );

    case "not_friends":
    default:
      return (
        <button
          type="button"
          className="friend-btn friend-btn--primary"
          onClick={sendRequest}
        >
          {t("friends.addToFriends")}
        </button>
      );
  }
};

export default FriendButton;