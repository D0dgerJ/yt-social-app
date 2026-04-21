import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatNotificationsDropdown.scss";
import { useNotificationStore } from "../../stores/notificationStore";

const CHAT_NOTIFICATION_TYPES = new Set<string>([
  "direct_message",
  "group_message",
  "message_mention",
  "message_reaction",
  "message_quote",
  "added_to_conversation",
]);

const ChatNotificationsDropdown: React.FC = () => {
  const navigate = useNavigate();

  const { notifications, markAsRead, removeNotification } =
    useNotificationStore();

  const chatNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        const t = String(n.type);
        return CHAT_NOTIFICATION_TYPES.has(t) && !n.isRead;
      }),
    [notifications]
  );

  const handleClick = (id: number, type: string, rawContent?: string | null) => {
    markAsRead(id);

    const payload = parsePayload(rawContent);
    navigateByChatNotification(type, payload, navigate);
  };

  if (!chatNotifications.length) {
    return (
      <div className="chat-notifications-dropdown">
        <h4 className="chat-dropdown-title">Chat notifications</h4>
        <p className="chat-dropdown-empty">No new chat events yet</p>
      </div>
    );
  }

  return (
    <div className="chat-notifications-dropdown">
      <h4 className="chat-dropdown-title">Chat notifications</h4>

      <ul className="chat-notifications-list">
        {chatNotifications.map((n) => {
          const payload = parsePayload(n.content);
          const desc = renderChatNotificationText(String(n.type), payload);

          return (
            <li
              key={n.id}
              className={`chat-notifications-item ${
                n.isRead
                  ? "chat-notifications-item--read"
                  : "chat-notifications-item--unread"
              }`}
              onClick={() => handleClick(n.id, String(n.type), n.content)}
            >
              <div className="chat-notifications-main">
                <img
                  src={n.fromUser?.profilePicture || "/assets/user.png"}
                  alt={n.fromUser?.username}
                  className="chat-notifications-avatar"
                />
                <div className="chat-notifications-text-block">
                  <span className="chat-notifications-text">
                    <strong>{n.fromUser?.username}</strong>{" "}
                    {desc.main}
                    {desc.details && (
                      <>
                        {" "}
                        <span className="chat-notifications-details">
                          {desc.details}
                        </span>
                      </>
                    )}
                  </span>

                  {desc.snippet && (
                    <span className="chat-notifications-snippet">
                      «{desc.snippet}»
                    </span>
                  )}

                  <span className="chat-notifications-date">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="chat-notifications-delete"
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

function navigateByChatNotification(
  type: string,
  payload: any,
  navigate: ReturnType<typeof useNavigate>
) {
  const conversationId = payload?.conversationId;
  const messageId = payload?.messageId;

  // Если есть id чата — пробрасываем его в URL.
  // TODO: если у тебя другой формат URL для чата — поменяй тут.
  if (conversationId != null) {
    const searchParams = new URLSearchParams();
    searchParams.set("conversationId", String(conversationId));
    if (messageId != null) {
      searchParams.set("messageId", String(messageId));
    }

    navigate(`/chat?${searchParams.toString()}`);
  } else {
    navigate("/chat");
  }
}

function renderChatNotificationText(
  type: string,
  payload: any
): { main: string; details?: string; snippet?: string } {
  const chatPart =
    payload?.conversationName != null
      ? `in chat «${payload.conversationName}»`
      : payload?.conversationId != null
      ? `in chat #${payload.conversationId}`
      : undefined;

  const snippet =
    typeof payload?.snippet === "string" && payload.snippet.trim().length > 0
      ? payload.snippet.trim()
      : undefined;

  switch (type) {
    case "direct_message":
      return {
        main: "sent you a message",
        details: chatPart,
        snippet,
      };

    case "group_message":
      return {
        main: "posted a message in the group chat",
        details: chatPart,
        snippet,
      };

    case "message_mention":
      return {
        main: "mentioned you in a message",
        details: chatPart,
        snippet,
      };

    case "message_reaction":
      return {
        main: "reacted to your message",
        details: chatPart,
      };

    case "message_quote":
      return {
        main: "replied quoting your message",
        details: chatPart,
        snippet,
      };

    case "added_to_conversation":
      return {
        main: "added you to a chat",
        details: chatPart,
      };

    default:
      return { main: "performed an action in chat", details: chatPart };
  }
}

export default ChatNotificationsDropdown;
