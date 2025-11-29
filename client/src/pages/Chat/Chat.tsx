import React, { useEffect, useState } from "react";
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

const Chat: React.FC = () => {
  const [search, setSearch] = useState("");

  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get("conversationId");
  const messageIdParam = searchParams.get("messageId");

  const deepLinkConversationId = conversationIdParam
    ? Number(conversationIdParam)
    : null;
  const deepLinkMessageId = messageIdParam ? Number(messageIdParam) : null;

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

  return (
    <>
      <Navbar />
      <div className="chat-layout">
        <div className="chat-sidebar-wrapper">
          <Sidebar />
        </div>

        <div
          className={`chat-wrapper ${
            currentConversationId ? "chat-split" : ""
          }`}
        >
          <ChatListHeader onSearchChange={setSearch} />

          <div className="chat-main-content">
            <div className="chat-list-pane">
              <ChatList search={search} />
            </div>

            {currentConversationId && (
              <div className="chat-window-pane">
                <ChatHeader />
                <ChatWindow scrollToMessageId={deepLinkMessageId ?? undefined} />
                <MessageInput />
              </div>
            )}
          </div>
        </div>

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