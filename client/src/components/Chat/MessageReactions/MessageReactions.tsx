import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toggleReactionREST } from '@/services/chatApi';
import './MessageReactions.scss';

type User = { id: number; username: string; profilePicture: string | null };
export type GroupedReaction = { emoji: string; count: number; users: User[] };

type Props = {
  messageId: number;
  currentUserId: number;

  reactions?: GroupedReaction[];

  onReactionsUpdate?: (reactions: GroupedReaction[]) => void;
  onToggleReaction?: (emoji: string) => void;

  recentEmojis?: string[];
  conversationId?: number; 
};

const DEFAULT_EMOJIS = ['❤️','👍','😂','🔥','👏','😮','😢','🎉','😡','🤔','🙌','🫶','👌','🥳','😎'];

const normalize = (arr: GroupedReaction[]) =>
  arr.map(r => ({ ...r, users: Array.isArray(r.users) ? r.users : [] }));

export const MessageReactions: React.FC<Props> = ({
  messageId,
  currentUserId,
  reactions,
  onReactionsUpdate,
  onToggleReaction,
  recentEmojis = DEFAULT_EMOJIS,
  conversationId,
}) => {
  const [optimistic, setOptimistic] = useState<GroupedReaction[] | null>(null);

  useEffect(() => {
    if (Array.isArray(reactions)) {
      setOptimistic(normalize(reactions));
    }
  }, [reactions]);

  const actual = optimistic ?? [];
  const userHas = useMemo(() => {
    const set = new Set<string>();
    actual.forEach(r => {
      if (r.users?.some(u => u.id === currentUserId)) set.add(r.emoji);
    });
    return set;
  }, [actual, currentUserId]);

  const applyLocalToggle = useCallback((emoji: string) => {
    const next = normalize(actual);
    const idx = next.findIndex(r => r.emoji === emoji);
    if (idx === -1) {
      next.push({
        emoji,
        count: 1,
        users: [{ id: currentUserId, username: 'me', profilePicture: null }],
      });
    } else {
      const meIdx = next[idx].users.findIndex(u => u.id === currentUserId);
      if (meIdx === -1) {
        next[idx] = {
          ...next[idx],
          count: next[idx].count + 1,
          users: [...next[idx].users, { id: currentUserId, username: 'me', profilePicture: null }],
        };
      } else {
        const users = next[idx].users.filter(u => u.id !== currentUserId);
        const count = Math.max(0, next[idx].count - 1);
        if (count === 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], count, users };
      }
    }
    setOptimistic(next);
    onReactionsUpdate?.(next);
  }, [actual, currentUserId, onReactionsUpdate]);

  const onPick = useCallback(async (emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(emoji);
      return;
    }
    try {
      applyLocalToggle(emoji);
      if (conversationId) {
        await toggleReactionREST(conversationId, messageId, emoji);
      }
    } catch {
      /**/
    }
  }, [conversationId, messageId, onToggleReaction, applyLocalToggle]);

  return (
    <div className="reactions-grid" role="listbox" aria-label="Выберите реакцию">
      {recentEmojis.map((e) => {
        const mine = userHas.has(e);
        return (
          <button
            key={e}
            className={`reactions-grid__btn ${mine ? 'is-active' : ''}`}
            onClick={() => onPick(e)}
            aria-pressed={mine}
            type="button"
          >
            {e}
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;
