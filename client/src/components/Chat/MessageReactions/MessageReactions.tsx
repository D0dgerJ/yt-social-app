import React, { useEffect, useState } from 'react';
import {
  getMessageReactions,
  reactToMessage,
} from '../../../utils/api/chat.api';
import './MessageReactions.scss';

interface User {
  id: number;
  username: string;
  profilePicture: string | null;
}

export interface GroupedReaction {
  emoji: string;
  count: number;
  users: User[];
}

interface MessageReactionsProps {
  messageId: number;
  currentUserId: number;
  onReactionsUpdate?: (reactions: GroupedReaction[]) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  currentUserId,
  onReactionsUpdate,
}) => {
  const [reactions, setReactions] = useState<GroupedReaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReactions = async () => {
    setLoading(true);
    try {
      const { reactions } = await getMessageReactions(messageId);
      setReactions(reactions);
      onReactionsUpdate?.(reactions);
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
        {emojis.map((emoji) => {
          const userReacted = reactions.some(
            (r) => r.emoji === emoji && r.users.some((u) => u.id === currentUserId)
          );

        return (
            <button
              key={emoji}
              className={`reaction-button${userReacted ? ' reaction-button--active' : ''}`}
              onClick={() => handleReact(emoji)}
              type="button"
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <div className="reaction-list">
        {loading ? (
          <span className="reaction-loading">Загрузка...</span>
        ) : (
          reactions.map((reaction) => (
            <div key={reaction.emoji} className="reaction-group">
              <span className="reaction-group__emoji">{reaction.emoji}</span>
              <span className="reaction-group__count">{reaction.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
