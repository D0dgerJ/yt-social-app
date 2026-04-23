import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();

  const { notifications, markAsRead, removeNotification } =
    useNotificationStore();

  const chatNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        const notificationType = String(n.type);
        return CHAT_NOTIFICATION_TYPES.has(notificationType) && !n.isRead;
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
        <h4 className="chat-dropdown-title">{t("chatNotifications.title")}</h4>
        <p className="chat-dropdown-empty">{t("chatNotifications.empty")}</p>
      </div>
    );
  }

  return (
    <div className="chat-notifications-dropdown">
      <h4 className="chat-dropdown-title">{t("chatNotifications.title")}</h4>

      <ul className="chat-notifications-list">
        {chatNotifications.map((n) => {
          const payload = parsePayload(n.content);
          const desc = renderChatNotificationText(t, String(n.type), payload);

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
                  alt={n.fromUser?.username || t("common.user")}
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
                    {formatDate(n.createdAt, i18n.language)}
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

function formatDate(iso: string, language: string) {
  const d = new Date(iso);
  const locale = language.startsWith("ru") ? "ru-RU" : "en-US";

  return d.toLocaleString(locale, {
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
  t: (key: string, options?: Record<string, unknown>) => string,
  type: string,
  payload: any
): { main: string; details?: string; snippet?: string } {
  const chatPart =
    payload?.conversationName != null
      ? t("chatNotifications.inNamedChat", { name: payload.conversationName })
      : payload?.conversationId != null
        ? t("chatNotifications.inChatById", { id: payload.conversationId })
        : undefined;

  const snippet =
    typeof payload?.snippet === "string" && payload.snippet.trim().length > 0
      ? payload.snippet.trim()
      : undefined;

  switch (type) {
    case "direct_message":
      return {
        main: t("chatNotifications.sentMessage"),
        details: chatPart,
        snippet,
      };

    case "group_message":
      return {
        main: t("chatNotifications.groupMessage"),
        details: chatPart,
        snippet,
      };

    case "message_mention":
      return {
        main: t("chatNotifications.mentionedMessage"),
        details: chatPart,
        snippet,
      };

    case "message_reaction":
      return {
        main: t("chatNotifications.reactedMessage"),
        details: chatPart,
      };

    case "message_quote":
      return {
        main: t("chatNotifications.quotedMessage"),
        details: chatPart,
        snippet,
      };

    case "added_to_conversation":
      return {
        main: t("chatNotifications.addedToChat"),
        details: chatPart,
      };

    default:
      return { main: t("chatNotifications.performedAction"), details: chatPart };
  }
}

export default ChatNotificationsDropdown;