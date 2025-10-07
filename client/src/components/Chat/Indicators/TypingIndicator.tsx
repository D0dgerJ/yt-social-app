import React, { memo, useMemo } from 'react';
import { useTypingStore, type UserTyping } from '@/stores/typingStore';
import './TypingIndicator.scss';

type Props = {
  conversationId?: number;
  resolveName?: (userId: number) => string | undefined;
};

function TypingIndicatorBase({ conversationId, resolveName }: Props) {
  // Подписываемся на ССЫЛКУ на map печатающих в чате,
  // а не на новый массив при каждом рендере.
  const convMap = useTypingStore((s) =>
    conversationId != null ? s.byConv[conversationId] : undefined
  );

  // Превращаем map -> массив только если convMap реально поменялась
  const list: UserTyping[] = useMemo(() => {
    if (!convMap) return [];
    return Object.values(convMap).sort((a, b) => a.userId - b.userId);
  }, [convMap]);

  const label = useMemo(() => {
    if (list.length === 0) return '';

    const names = list
      .map(
        (u) =>
          resolveName?.(u.userId) ||
          u.displayName ||
          u.username ||
          `User#${u.userId}`
      )
      .slice(0, 3);

    const base = names.join(', ');
    if (list.length === 1) return `${base} печатает…`;
    return list.length > 3
      ? `${base} и ещё ${list.length - 3} печатают…`
      : `${base} печатают…`;
  }, [list, resolveName]);

  if (!label) return null;

  return (
    <div className="typing-indicator">
      <span className="typing-indicator__dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
      <span className="typing-indicator__label">{label}</span>
    </div>
  );
}

const TypingIndicator = memo(TypingIndicatorBase);
export default TypingIndicator;
