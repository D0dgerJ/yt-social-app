import React, { useContext } from "react";
import { useFriendStatus } from "../../hooks/useFriendStatus";
import { AuthContext } from "../../context/AuthContext";
import "./FriendButton.scss";

interface FriendButtonProps {
  targetUserId: number;
}

const FriendButton: React.FC<FriendButtonProps> = ({ targetUserId }) => {
  const { user } = useContext(AuthContext);

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
        Loading...
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
          Remove from friends
        </button>
      );

    case "request_sent":
      return (
        <button
          type="button"
          className="friend-btn friend-btn--ghost"
          onClick={cancelRequest}
        >
          Cancel request
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
            Accept
          </button>
          <button
            type="button"
            className="friend-btn friend-btn--danger"
            onClick={rejectRequest}
          >
            Decline
          </button>
        </div>
      );

    case "following":
      return (
        <button type="button" className="friend-btn friend-btn--ghost" disabled>
          You are following this user
        </button>
      );

    case "follower":
      return (
        <button
          type="button"
          className="friend-btn friend-btn--secondary"
          onClick={sendRequest}
        >
          Follower · add to friends
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
          Add to friends
        </button>
      );
  }
};

export default FriendButton;