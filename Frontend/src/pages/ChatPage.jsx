import React from "react";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import "./ChatPage.css";

const ChatPage = () => {
  return (
    <div className="chat-page-container">
      <div className="main-content">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatPage;
