import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationsDropdown.scss";
import { useNotificationStore } from "../../stores/notificationStore";

interface Props {
  onClose?: () => void;
}

const CHAT_NOTIFICATION_TYPES = new Set<string>([
  "direct_message",
  "group_message",
  "message_mention",
  "message_reaction",
  "message_quote",
  "added_to_conversation",
]);

const NotificationsDropdown: React.FC<Props> = ({ onClose }) => {
  const navigate = useNavigate();

  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    removeNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (!notifications.length) {
      fetchNotifications();
    }
  }, [fetchNotifications, notifications.length]);

  const generalNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        const t = String(n.type);
        return !CHAT_NOTIFICATION_TYPES.has(t);
      }),
    [notifications]
  );

  const generalUnreadCount = useMemo(
    () => generalNotifications.filter((n) => !n.isRead).length,
    [generalNotifications]
  );

  const handleItemClick = (
    id: number,
    type: string,
    content?: string | null,
    fromUsername?: string
  ) => {
    if (!Number.isFinite(id)) return;

    markAsRead(id);

    const payload = parsePayload(content);
    navigateByNotification({ type, payload, fromUsername }, navigate);
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <span className="notifications-title">Уведомления</span>

        {generalUnreadCount > 0 && (
          <span className="notifications-counter">
            Непрочитанных: {generalUnreadCount}
          </span>
        )}

        {onClose && (
          <button
            type="button"
            className="notifications-close"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>

      <div className="notifications-body">
        {loading && <p className="notifications-info">Загрузка...</p>}

        {error && !loading && (
          <p className="notifications-error">
            Ошибка при загрузке: {error}
          </p>
        )}

        {!loading && !error && generalNotifications.length === 0 && (
          <p className="notifications-info">Пока нет уведомлений</p>
        )}

        {!loading && !error && generalNotifications.length > 0 && (
          <ul className="notifications-list">
            {generalNotifications.map((n) => {
              const payload = parsePayload(n.content);
              const desc = renderNotificationText(n.type, payload);

              return (
                <li
                  key={n.id}
                  className={`notifications-item ${
                    n.isRead
                      ? "notifications-item--read"
                      : "notifications-item--unread"
                  }`}
                  onClick={() =>
                    handleItemClick(
                      n.id,
                      n.type,
                      n.content,
                      n.fromUser?.username
                    )
                  }
                >
                  <div className="notifications-item-main">
                    <img
                      src={n.fromUser?.profilePicture || "/assets/user.png"}
                      alt={n.fromUser?.username}
                      className="notifications-avatar"
                    />
                    <div className="notifications-text-block">
                      <span className="notifications-text">
                        <strong>{n.fromUser?.username}</strong>{" "}
                        {desc.main}
                        {desc.details && (
                          <>
                            {" "}
                            <span className="notifications-details">
                              {desc.details}
                            </span>
                          </>
                        )}
                      </span>

                      {desc.snippet && (
                        <span className="notifications-snippet">
                          «{desc.snippet}»
                        </span>
                      )}

                      <span className="notifications-date">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="notifications-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id);
                    }}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};


function parsePayload(raw?: string | null): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function navigateByNotification(
  opts: { type: string; payload: any; fromUsername?: string },
  navigate: ReturnType<typeof useNavigate>
) {
  const { type, payload, fromUsername } = opts;

  const postId = payload?.postId;
  const commentId = payload?.commentId;

  switch (type) {
    case "post_like":
    case "comment_like":
    case "reply_like":
    case "comment_on_post":
    case "reply_to_comment":
    case "comment_mention":
    case "post_mention":
    case "post_reply":
    case "post_share": {
      if (postId != null) {
        navigate(`/post/${postId}`); 
      }
      break;
    }

    case "follow": {
      if (fromUsername) {
        navigate(`/profile/${fromUsername}`);
      }
      break;
    }

    default:
      break;
  }
}

function renderNotificationText(
  type: string,
  payload: any
): { main: string; details?: string; snippet?: string } {
  const postPart =
    payload?.postId != null ? `к посту #${payload.postId}` : undefined;
  const commentPart =
    payload?.commentId != null
      ? `к комментарию #${payload.commentId}`
      : undefined;
  const snippet =
    typeof payload?.snippet === "string" && payload.snippet.trim().length > 0
      ? payload.snippet.trim()
      : undefined;

  switch (type) {
    case "post_like":
      return {
        main: "лайкнул(а) ваш пост",
        details: postPart,
      };

    case "comment_like":
      return {
        main: "лайкнул(а) ваш комментарий",
        details: commentPart || postPart,
      };

    case "reply_like":
      return {
        main: "лайкнул(а) ваш ответ",
        details: commentPart || postPart,
      };

    case "comment_on_post":
      return {
        main: "прокомментировал(а) ваш пост",
        details: postPart,
        snippet,
      };

    case "reply_to_comment":
      return {
        main: "ответил(а) на ваш комментарий",
        details: commentPart || postPart,
        snippet,
      };

    case "comment_mention":
      return {
        main: "упомянул(а) вас в комментарии",
        details: postPart,
        snippet,
      };

    case "post_mention":
      return {
        main: "упомянул(а) вас в посте",
        details: postPart,
        snippet,
      };

    case "post_reply":
      return {
        main: "ответил(а) на ваш пост",
        details: postPart,
        snippet,
      };

    case "post_share":
      return {
        main: "поделился(ась) вашим постом",
        details: postPart,
      };

    case "follow":
      return { main: "подписался(ась) на вас" };

    default:
      return { main: "совершил(а) действие" };
  }
}

export default NotificationsDropdown;
