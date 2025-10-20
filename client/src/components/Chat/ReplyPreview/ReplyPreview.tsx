import React from 'react';
import type { RepliedToLite, MediaType, UserLite } from '@/stores/messageStore';

type Props = {
  reply?: RepliedToLite | null;
  onClick?: () => void;
  className?: string;
};

function mediaLabel(mediaType?: MediaType, fileName?: string | null) {
  switch (mediaType) {
    case 'image':
      return '📷 Фото';
    case 'video':
      return '📹 Видео';
    case 'audio':
      return '🎵 Аудио';
    case 'gif':
      return 'GIF';
    case 'sticker':
      return 'Стикер';
    case 'file':
      return fileName ? `📎 ${fileName}` : '📎 Файл';
    default:
      return '';
  }
}

function authorName(sender?: UserLite | null) {
  if (!sender) return 'Сообщение';
  return sender.username || `@user_${sender.id}`;
}

export const ReplyPreview: React.FC<Props> = ({ reply, onClick, className }) => {
  if (!reply) return null;

  const hasText = !!reply.content && reply.content.trim().length > 0;
  const label = mediaLabel(reply.mediaType, reply.fileName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full text-left cursor-pointer mb-1 rounded-lg border-l-4',
        'border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/80',
        'px-2 py-1 transition-colors',
        className || '',
      ].join(' ')}
      title="Показать исходное сообщение"
    >
      <div className="text-xs text-emerald-700/80 mb-0.5 font-medium">
        Ответ на {authorName(reply.sender)}
      </div>

      <div className="text-sm text-emerald-900 line-clamp-2 whitespace-pre-wrap">
        {hasText ? reply.content : (label || 'Без текста')}
      </div>
    </button>
  );
};

export default ReplyPreview;
