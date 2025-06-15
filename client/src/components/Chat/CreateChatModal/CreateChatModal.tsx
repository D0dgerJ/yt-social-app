import React, { useEffect, useState } from 'react';
import { createChat } from '@/utils/api/chat.api';
import { getUserFriends } from '@/utils/api/user.api';
import { useUserStore } from '@/stores/userStore';
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
  const { currentUser } = useUserStore();

  useEffect(() => {
    console.log('currentUser:', currentUser);
    console.log('Попробуем получить друзей...');

    const fetchFriends = async () => {
      if (!currentUser?.id) return;
      try {
        const res = await getUserFriends(currentUser.id);
        console.log("Полученные друзья:", res);
        setFriends(res);
      } catch (e) {
        console.error("Не удалось получить друзей", e);
      }
    };
    fetchFriends();
  }, [currentUser]);

  const toggleSelect = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selected.length > 0 && currentUser?.id) {
      const allParticipantIds = [...selected, currentUser.id];
      console.log("Создаём чат с участниками:", allParticipantIds);

      try {
        await createChat(allParticipantIds);
        onCreated();
        onClose();
      } catch (error) {
        console.error("Ошибка при создании чата:", error);
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Создать чат</h2>
        {friends.length === 0 ? (
          <p>У вас нет друзей</p>
        ) : (
          <ul className="friend-list">
            {friends.map(friend => (
              <li key={friend.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(friend.id)}
                    onChange={() => toggleSelect(friend.id)}
                  />
                  {friend.username}
                </label>
              </li>
            ))}
          </ul>
        )}
        <button onClick={handleCreate} disabled={selected.length === 0}>
          Создать
        </button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
};

export default CreateChatModal;
