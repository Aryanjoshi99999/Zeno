import React from "react";
import { useChat } from "../../context/ChatContext";

const MessageInput = () => {
  const { message, setMessage, sendMessage, handleInputChange } = useChat();

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="message-input-area">
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default MessageInput;
