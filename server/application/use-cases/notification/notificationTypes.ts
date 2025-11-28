export type NotificationType =
  // 🔹 Друзья
  | "friend_request_received"
  | "friend_request_accepted"
  | "friend_request_declined"
  | "friend_removed"

  // 🔹 Подписки
  | "follow"

  // 🔹 Сообщения / чаты
  | "direct_message"
  | "group_message"
  | "message_reaction"
  | "message_quote"
  | "message_mention"
  | "added_to_conversation"

  // 🔹 Стримы
  | "stream_started"

  // 🔹 Лайки
  | "post_like"
  | "comment_like"
  | "reply_like"

  // 🔹 Комментарии
  | "comment_on_post"
  | "reply_to_comment"
  | "comment_mention"

  // 🔹 Репосты
  | "post_share"

  // 🔹 Посты с упоминанием
  | "post_reply"
  | "post_mention";
