import React, { useEffect, useState } from 'react';
import { getMessageReactions, reactToMessage } from '../../../utils/api/chat.api';
import './MessageReactions.scss';

interface User {
  id: number;
  username: string;
  profilePicture: string | null;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  users: User[];
}

interface MessageReactionsProps {
  messageId: number;
  currentUserId: number;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  currentUserId,
}) => {
  const [reactions, setReactions] = useState<GroupedReaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReactions = async () => {
    setLoading(true);
    try {
      const { reactions } = await getMessageReactions(messageId);
      setReactions(reactions);
    } catch (err) {
      console.error('Не удалось получить реакции');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [messageId]);

  const handleReact = async (emoji: string) => {
    try {
      await reactToMessage(messageId, emoji);
      await fetchReactions();
    } catch (err) {
      console.error('Ошибка при отправке реакции');
    }
  };

  const emojis = ['❤️', '😂', '👍', '👎', '🔥', '😢'];

  return (
    <div className="message-reactions">
      <div className="reaction-options">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            className="reaction-button"
            onClick={() => handleReact(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="reaction-list">
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          reactions.map((reaction) => (
            <div key={reaction.emoji} className="reaction-group">
              <span className="emoji">{reaction.emoji}</span>
              <span className="count">{reaction.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
