import React from 'react';
import cn from 'classnames';
import './MessageStatus.scss';

type Props = {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
};

const statusLabel: Record<NonNullable<Props['status']>, string> = {
  sending: 'Отправка…',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Ошибка',
};

const MessageStatus: React.FC<Props> = ({ status = 'sent' }) => {
  return <span className={cn('msg-status', `msg-status--${status}`)}>{statusLabel[status]}</span>;
};

export default MessageStatus;