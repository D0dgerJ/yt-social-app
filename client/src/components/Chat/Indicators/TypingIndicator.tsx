import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTypingStore, type UserTyping } from "@/stores/typingStore";
import "./TypingIndicator.scss";

type Props = {
  conversationId?: number;
  resolveName?: (userId: number) => string | undefined;
};

function TypingIndicatorBase({ conversationId, resolveName }: Props) {
  const { t } = useTranslation();

  const convMap = useTypingStore((s) =>
    conversationId != null ? s.byConv[conversationId] : undefined
  );

  const list: UserTyping[] = useMemo(() => {
    if (!convMap) return [];
    return Object.values(convMap).sort((a, b) => a.userId - b.userId);
  }, [convMap]);

  const label = useMemo(() => {
    if (list.length === 0) return "";

    const names = list
      .map(
        (u) =>
          resolveName?.(u.userId) ||
          u.displayName ||
          u.username ||
          `User#${u.userId}`
      )
      .slice(0, 3);

    const base = names.join(", ");

    if (list.length === 1) {
      return t("chat.isTyping", { name: base });
    }

    if (list.length > 3) {
      return t("chat.andMoreAreTyping", {
        names: base,
        count: list.length - 3,
      });
    }

    return t("chat.moreAreTyping", { names: base });
  }, [list, resolveName, t]);

  if (!label) return null;

  return (
    <div className="typing-indicator">
      <span className="typing-indicator__dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
      <span className="typing-indicator__label">{label}</span>
    </div>
  );
}

const TypingIndicator = memo(TypingIndicatorBase);
export default TypingIndicator;