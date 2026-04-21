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
      return '📷 Photo';
    case 'video':
      return '📹 Video';
    case 'audio':
      return '🎵 Audio';
    case 'gif':
      return 'GIF';
    case 'sticker':
      return 'Sticker';
    case 'file':
      return fileName ? `📎 ${fileName}` : '📎 File';
    default:
      return '';
  }
}

function authorName(sender?: UserLite | null) {
  if (!sender) return 'Message';
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
      title="Show original message"
    >
      <div className="reply-preview__content">
        <div className="reply-preview__author">
          Reply to {authorName(reply.sender)}
        </div>

        <div className="reply-preview__text">
          {hasText ? reply.content : label || 'No text'}
        </div>
      </div>
    </button>
  );
};

export default ReplyPreview;