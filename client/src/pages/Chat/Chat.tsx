import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Rightbar from "../../components/Rightbar/Rightbar";
import ChatList from "../../components/Chat/ChatList/ChatList";
import ChatListHeader from "../../components/Chat/ChatListHeader/ChatListHeader";
import ChatWindow from "../../components/Chat/ChatWindow/ChatWindow";
import MessageInput from "../../components/Chat/MessageInput/MessageInput";
import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import "./Chat.scss";

const Chat = () => {
  const { currentConversationId } = useChatStore();
  const { clearMessages } = useMessageStore();
  const [search, setSearch] = useState("");

  useChatSocket();

  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, [clearMessages]);

    return (
    <>
      <Navbar />
      <div className="chat-layout">
        <div className="chat-sidebar-wrapper">
          <Sidebar />
        </div>

        <div className={`chat-wrapper ${currentConversationId ? "chat-split" : ""}`}>
          <ChatListHeader onSearchChange={setSearch} />

          <div className="chat-main-content">
            <div className="chat-list-pane">
              <ChatList search={search} />
            </div>

            {currentConversationId && (
              <div className="chat-window-pane">
                <ChatWindow />
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
