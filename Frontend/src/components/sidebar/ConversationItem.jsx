import React from "react";
import { useChat } from "../../context/ChatContext";

const ConversationItem = ({
  user,
  isSelected,
  onClick,
  isOnline,
  unrCount,
}) => {
  return (
    <div
      className={`conversation-item ${isSelected ? "active" : ""}`}
      onClick={onClick}
    >
      {/* We can add an avatar component here later */}
      <div className="conversation-details">
        <div className="converation-nandum">
          <span className="conversation-name">{user.username}</span>
          {unrCount > 0 && (
            <span className="conversation-unreadM">{unrCount}</span>
          )}
        </div>

        <p className="conversation-snippet">Last message snippet...</p>

        {isOnline ? (
          <span className="conversation-isOnline">🟢</span>
        ) : (
          <span className="conversation-isOnline">⚪</span>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
