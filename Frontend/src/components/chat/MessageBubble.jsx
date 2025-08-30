import React from "react";

const MessageBubble = ({ message, isSent }) => {
  return (
    <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
      {message.content}
    </div>
  );
};

export default MessageBubble;
