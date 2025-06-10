import React, { useEffect, useState, useContext } from "react";
import {
  getIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";
import "./NotificationsInteractions.scss";

interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    profilePicture?: string;
  };
}

const NotificationsInteractions: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getIncomingFriendRequests();
      setRequests(data);
    } catch (error) {
      console.error("Ошибка при загрузке запросов:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const handleAccept = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Ошибка при принятии запроса:", error);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Ошибка при отклонении запроса:", error);
    }
  };

  return (
    <div className="notifications-interactions">

      {loading ? (
        <p>Загрузка...</p>
      ) : requests.length === 0 ? (
        <p>Нет новых запросов</p>
      ) : (
        <ul className="friend-requests-list">
          {requests.map(({ id, sender }) => (
            <li key={id} className="friend-request-item">
              <div className="friend-request-top">
                <img
                  src={sender.profilePicture || "/assets/user.png"}
                  className="friend-avatar"
                  alt={sender.username}
                />
                <span className="friend-username">
                  Запрос в друзья от {sender.username}
                </span>
              </div>
              <div className="friend-request-bottom">
                <button
                  onClick={() => handleAccept(id)}
                  className="btn btn-success btn-11"
                >
                  Принять
                  <div className="dot"></div>
                </button>
                <button
                  onClick={() => handleReject(id)}
                  className="btn btn-danger btn-11"
                >
                  Отклонить
                  <div className="dot"></div>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsInteractions;