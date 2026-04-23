import React from "react";
import { useTranslation } from "react-i18next";
import type { RepliedToLite, MediaType, UserLite } from "@/stores/messageStore";
import "./ReplyPreview.scss";

type Props = {
  reply?: RepliedToLite | null;
  onClick?: () => void;
  className?: string;
};

export const ReplyPreview: React.FC<Props> = ({ reply, onClick, className }) => {
  const { t } = useTranslation();

  const mediaLabel = (mediaType?: MediaType, fileName?: string | null) => {
    switch (mediaType) {
      case "image":
        return `📷 ${t("chat.photo")}`;
      case "video":
        return `📹 ${t("chat.video")}`;
      case "audio":
        return `🎵 ${t("chat.audio")}`;
      case "gif":
        return "GIF";
      case "sticker":
        return t("chat.sticker");
      case "file":
        return fileName ? `📎 ${fileName}` : `📎 ${t("common.file")}`;
      default:
        return "";
    }
  };

  const authorName = (sender?: UserLite | null) => {
    if (!sender) return t("chat.message");
    return sender.username || `@user_${sender.id}`;
  };

  if (!reply) return null;

  const hasText = !!reply.content && reply.content.trim().length > 0;
  const label = mediaLabel(reply.mediaType, reply.fileName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={["reply-preview", className || ""].join(" ").trim()}
      title={t("chat.showOriginalMessage")}
    >
      <div className="reply-preview__content">
        <div className="reply-preview__author">
          {t("chat.replyTo", { name: authorName(reply.sender) })}
        </div>

        <div className="reply-preview__text">
          {hasText ? reply.content : label || t("navbar.noText")}
        </div>
      </div>
    </button>
  );
};

export default ReplyPreview;