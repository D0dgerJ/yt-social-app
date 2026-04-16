import React from 'react';
import type { RepliedToLite, MediaType, UserLite } from '@/stores/messageStore';
import './ReplyPreview.scss';

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
      className={['reply-preview', className || ''].join(' ').trim()}
      title="Показать исходное сообщение"
    >
      <div className="reply-preview__content">
        <div className="reply-preview__author">
          Ответ на {authorName(reply.sender)}
        </div>

        <div className="reply-preview__text">
          {hasText ? reply.content : label || 'Без текста'}
        </div>
      </div>
    </button>
  );
};

export default ReplyPreview;