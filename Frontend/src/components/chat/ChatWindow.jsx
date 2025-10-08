import React, { useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import "./ChatWindow.css";

const ChatWindow = () => {
  const {
    selectedUser,
    messages,
    handleScroll,
    messagesRef,
    getTypingMessage,
  } = useChat();

  const typingMessage = getTypingMessage();

  if (!selectedUser) {
    return (
      <div className="chat-window-container no-user">
        <h2>Select a chat to start messaging</h2>
      </div>
    );
  }

  if (selectedUser._id == 1) {
    return (
      <div className="chat-window-container no-user">
        <h2>Kindly add friends , you can start with "sample" (username)</h2>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <h3>{selectedUser.username}</h3>

        {typingMessage && <p className="typing-status">{typingMessage}</p>}
      </div>
      <div className="message-list" onScroll={handleScroll} ref={messagesRef}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg?._id}
            message={msg}
            isSent={msg?.sender?._id !== selectedUser._id}
          />
        ))}
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
