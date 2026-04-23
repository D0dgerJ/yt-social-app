import React from "react";
import { useTranslation } from "react-i18next";
import cn from "classnames";
import "./MessageStatus.scss";

type Props = {
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
};

const MessageStatus: React.FC<Props> = ({ status = "sent" }) => {
  const { t } = useTranslation();

  const statusLabel: Record<NonNullable<Props["status"]>, string> = {
    sending: t("chat.sending"),
    sent: t("chat.sent"),
    delivered: t("chat.delivered"),
    read: t("chat.read"),
    failed: t("chat.error"),
  };

  return (
    <span className={cn("msg-status", `msg-status--${status}`)}>
      {statusLabel[status]}
    </span>
  );
};

export default MessageStatus;