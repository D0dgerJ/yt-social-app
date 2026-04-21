import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationsDropdown.scss";
import { useNotificationStore } from "../../stores/notificationStore";
import noProfilePic from "../../assets/profile/user.png";

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

const POST_RELATED_NOTIFICATION_TYPES = new Set<string>([
  "post_like",
  "comment_like",
  "reply_like",
  "comment_on_post",
  "reply_to_comment",
  "comment_mention",
  "post_mention",
  "post_reply",
  "post_share",
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

    onClose?.();
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <span className="notifications-title">Notifications</span>

        {generalUnreadCount > 0 && (
          <span className="notifications-counter">
            Unread: {generalUnreadCount}
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
        {loading && <p className="notifications-info">Loading...</p>}

        {error && !loading && (
          <p className="notifications-error">
            Load error: {error}
          </p>
        )}

        {!loading && !error && generalNotifications.length === 0 && (
          <p className="notifications-info">No notifications yet</p>
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
                      src={n.fromUser?.profilePicture || noProfilePic}
                      alt={n.fromUser?.username || "User"}
                      className="notifications-avatar"
                      onError={(e) => {
                        e.currentTarget.src = noProfilePic;
                      }}
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
  opts: {
    type: string;
    payload: any;
    fromUsername?: string;
  },
  navigate: ReturnType<typeof useNavigate>
) {
  const { type, payload, fromUsername } = opts;

  const postId = payload?.postId;
  const commentId = payload?.commentId;

  if (POST_RELATED_NOTIFICATION_TYPES.has(type) && postId != null) {
    const search = new URLSearchParams();

    if (commentId != null) {
      search.set("commentId", String(commentId));
    }

    const query = search.toString();
    navigate(`/post/${postId}${query ? `?${query}` : ""}`);
    return;
  }

  if (type === "follow" && fromUsername) {
    navigate(`/profile/${fromUsername}`);
  }
}

function renderNotificationText(
  type: string,
  payload: any
): { main: string; details?: string; snippet?: string } {
  const postPart =
    payload?.postId != null ? `for post #${payload.postId}` : undefined;
  const commentPart =
    payload?.commentId != null
      ? `for comment #${payload.commentId}`
      : undefined;
  const snippet =
    typeof payload?.snippet === "string" && payload.snippet.trim().length > 0
      ? payload.snippet.trim()
      : undefined;

  switch (type) {
    case "post_like":
      return {
        main: "liked your post",
        details: postPart,
      };

    case "comment_like":
      return {
        main: "liked your comment",
        details: commentPart || postPart,
      };

    case "reply_like":
      return {
        main: "liked your reply",
        details: commentPart || postPart,
      };

    case "comment_on_post":
      return {
        main: "commented on your post",
        details: postPart,
        snippet,
      };

    case "reply_to_comment":
      return {
        main: "replied to your comment",
        details: commentPart || postPart,
        snippet,
      };

    case "comment_mention":
      return {
        main: "mentioned you in a comment",
        details: postPart,
        snippet,
      };

    case "post_mention":
      return {
        main: "mentioned you in a post",
        details: postPart,
        snippet,
      };

    case "post_reply":
      return {
        main: "replied to your pos",
        details: postPart,
        snippet,
      };

    case "post_share":
      return {
        main: "shared your post",
        details: postPart,
      };

    case "follow":
      return { main: "started following you" };

    default:
      return { main: "performed an action" };
  }
}

export default NotificationsDropdown;