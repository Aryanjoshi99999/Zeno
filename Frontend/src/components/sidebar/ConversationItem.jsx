import React from "react";

const ConversationItem = ({ user, isSelected, onClick, isOnline }) => {
  return (
    <div
      className={`conversation-item ${isSelected ? "active" : ""}`}
      onClick={onClick}
    >
      {/* We can add an avatar component here later */}
      <div className="conversation-details">
        <p className="conversation-name">{user.username}</p>
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
