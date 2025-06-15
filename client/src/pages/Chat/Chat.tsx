import React, { useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Rightbar from "../../components/Rightbar/Rightbar";
import ChatList from "../../components/Chat/ChatList/ChatList";
import ChatWindow from "../../components/Chat/ChatWindow/ChatWindow";
import MessageInput from "../../components/Chat/MessageInput/MessageInput";
import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import { useChatSocket } from "@/hooks/useChatSocket";
import "./Chat.scss";

const Chat = () => {
  const { currentConversationId } = useChatStore();
  const { clearMessages } = useMessageStore();

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

        <div className="chat-wrapper">
          {currentConversationId ? (
            <div className="chat-window-container">
              <ChatWindow />
              <MessageInput />
            </div>
          ) : (
            <ChatList />
          )}
        </div>

        <div className="rightbar-wrapper">
          <Rightbar />
        </div>
      </div>
    </>
  );
};

export default Chat;
