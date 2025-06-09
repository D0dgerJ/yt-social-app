import React, { useContext } from "react";
import { useFriendStatus } from "../../hooks/useFriendStatus";
import { AuthContext } from "../../context/AuthContext";

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
    return <button className="btn btn-outline-secondary" disabled>Загрузка...</button>;
  }

  switch (status) {
    case "friends":
      return (
        <button className="btn btn-secondary" onClick={cancelRequest}>
          Удалить из друзей
        </button>
      );
    case "request_sent":
      return (
        <button className="btn btn-warning" onClick={cancelRequest}>
          Отменить запрос
        </button>
      );
    case "request_received":
      return (
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-success" onClick={acceptRequest}>
            Принять
          </button>
          <button className="btn btn-danger" onClick={rejectRequest}>
            Отклонить
          </button>
        </div>
      );
    case "following":
      return (
        <button className="btn btn-outline-secondary" disabled>
          Вы подписаны
        </button>
      );
    case "follower":
      return (
        <button className="btn btn-outline-primary" onClick={sendRequest}>
          Подписчик — добавить в друзья
        </button>
      );
    case "not_friends":
    default:
      return (
        <button className="btn btn-primary" onClick={sendRequest}>
          Добавить в друзья
        </button>
      );
  }
};

export default FriendButton;
