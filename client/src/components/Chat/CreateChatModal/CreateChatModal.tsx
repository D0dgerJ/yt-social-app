import React, { useEffect, useState } from "react";
import { createChat } from "@/utils/api/chat.api";
import { getUserFriends } from "@/utils/api/user.api";
import { useUserStore } from "@/stores/userStore";
import "./CreateChatModal.scss";

interface Friend {
  id: number;
  username: string;
  profilePicture: string | null;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateChatModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useUserStore();

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await getUserFriends(currentUser.id);
        setFriends(res || []);
      } catch (e) {
        console.error("❌ Не удалось получить друзей:", e);
        setError("Не удалось загрузить список друзей");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [currentUser]);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selected.length === 0 || !currentUser?.id) return;

    setIsCreating(true);
    setError(null);

    try {
      await createChat(selected, currentUser.id);
      onCreated();
      onClose();
    } catch (e) {
      console.error("❌ Ошибка при создании чата:", e);
      setError("Ошибка при создании чата. Попробуйте позже.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Создать чат</h2>

        {isLoading ? (
          <p>Загрузка списка друзей...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : friends.length === 0 ? (
          <p>У вас пока нет друзей</p>
        ) : (
          <ul className="friend-list">
            {friends.map((friend) => (
              <li key={friend.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(friend.id)}
                    onChange={() => toggleSelect(friend.id)}
                  />
                  <img
                    src={friend.profilePicture || "/default-avatar.png"}
                    alt={friend.username}
                    className="friend-avatar"
                  />
                  <span>{friend.username}</span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <button
            onClick={handleCreate}
            disabled={selected.length === 0 || isCreating}
          >
            {isCreating ? "Создание..." : "Создать"}
          </button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default CreateChatModal;
