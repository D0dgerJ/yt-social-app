import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Rightbar from "../../components/Rightbar/Rightbar";
import ChatList from "../../components/Chat/ChatList/ChatList";
import ChatListHeader from "../../components/Chat/ChatListHeader/ChatListHeader";
import ChatWindow from "../../components/Chat/ChatWindow/ChatWindow";
import MessageInput from "../../components/Chat/MessageInput/MessageInput";
import ChatHeader from "../../components/Chat/ChatListHeader/ChatHeader";

import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import { useNotificationStore } from "@/stores/notificationStore";

import "./Chat.scss";

const CHAT_NOTIFICATION_TYPES = new Set<string>([
  "direct_message",
  "group_message",
  "message_mention",
  "message_reaction",
  "message_quote",
  "added_to_conversation",
]);

const DEFAULT_LIST_WIDTH = 340;
const MIN_LIST_WIDTH = 240;
const MAX_LIST_WIDTH = 520;

const Chat: React.FC = () => {
  const [search, setSearch] = useState("");
  const [listWidth, setListWidth] = useState(DEFAULT_LIST_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const wrapperRef = useRef<HTMLElement | null>(null);

  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get("conversationId");

  const deepLinkConversationId = conversationIdParam
    ? Number(conversationIdParam)
    : null;

  const { currentConversationId, setCurrentConversationId } = useChatStore();
  const { clearMessages, setActiveConversation } = useMessageStore();
  const { notifications, markAsRead } = useNotificationStore();

  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, [clearMessages]);

  useEffect(() => {
    if (!deepLinkConversationId || !Number.isFinite(deepLinkConversationId)) {
      return;
    }

    setCurrentConversationId(deepLinkConversationId);
    setActiveConversation(deepLinkConversationId);
  }, [deepLinkConversationId, setCurrentConversationId, setActiveConversation]);

  useEffect(() => {
    if (!currentConversationId) return;

    const related = notifications.filter((n) => {
      const t = String(n.type);
      if (!CHAT_NOTIFICATION_TYPES.has(t)) return false;
      if (n.isRead) return false;

      const payload = parsePayload(n.content);
      return payload?.conversationId === currentConversationId;
    });

    if (!related.length) return;

    related.forEach((n) => {
      markAsRead(n.id);
    });
  }, [currentConversationId, notifications, markAsRead]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const nextWidth = e.clientX - rect.left;

      const maxAllowed = Math.min(MAX_LIST_WIDTH, rect.width - 320);
      const clamped = Math.max(MIN_LIST_WIDTH, Math.min(nextWidth, maxAllowed));

      setListWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  return (
    <>
      <Navbar />

      <div className="chat-layout">
        <div className="chat-sidebar-wrapper">
          <Sidebar />
        </div>

        <main
          ref={wrapperRef}
          className={`chat-wrapper ${
            currentConversationId ? "chat-wrapper--split" : ""
          } ${isResizing ? "chat-wrapper--resizing" : ""}`}
          style={
            currentConversationId
              ? ({
                  ["--chat-list-width" as string]: `${listWidth}px`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <section className="chat-panel chat-list-shell">
            <div className="chat-list-header-shell">
              <ChatListHeader value={search} onSearchChange={setSearch} />
            </div>

            <div className="chat-main-content">
              <div className="chat-list-pane">
                <ChatList search={search} />
              </div>

              {currentConversationId && (
                <>
                  <div
                    className="chat-resize-handle"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize chat list"
                    onMouseDown={() => setIsResizing(true)}
                  />
                  <div className="chat-window-pane">
                    <ChatHeader />
                    <ChatWindow />
                    <MessageInput />
                  </div>
                </>
              )}
            </div>
          </section>
        </main>

        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default Chat;

function parsePayload(raw?: string | null): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}