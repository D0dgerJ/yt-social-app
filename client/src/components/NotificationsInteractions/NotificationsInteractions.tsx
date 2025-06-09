import React, { useEffect, useState, useContext } from "react";
import {
  getIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../utils/api/user.api";
import { AuthContext } from "../../context/AuthContext";

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
      <h3>Запросы в друзья</h3>

      {loading ? (
        <p>Загрузка...</p>
      ) : requests.length === 0 ? (
        <p>Нет новых запросов</p>
      ) : (
        <ul className="friend-requests-list">
          {requests.map(({ id, sender }) => (
            <li key={id} className="friend-request-item">
              <img
                src={sender.profilePicture || "/assets/user.png"}
                alt={sender.username}
                className="friend-avatar"
              />
              <span className="friend-username">{sender.username}</span>
              <div className="friend-actions">
                <button
                  onClick={() => handleAccept(id)}
                  className="btn btn-success btn-sm"
                >
                  Принять
                </button>
                <button
                  onClick={() => handleReject(id)}
                  className="btn btn-danger btn-sm"
                >
                  Отклонить
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