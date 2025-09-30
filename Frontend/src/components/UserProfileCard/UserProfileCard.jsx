import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./UserProfileCard.css";
import apiClient from "../../apiClient";

const UserProfileCard = ({ user }) => {
  const handleSendFriendRequest = async () => {
    try {
      const response = await apiClient.post(
        `/api/user/profile/friend-request/${user._id}`
      );

      const message = response.data.message;
      alert(message);
    } catch (err) {
      alert(err.response?.data?.message || "Could not send friend request.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-profilecard">
      <Link to="/" className="back-button">
        &larr; Home
      </Link>
      <div className="profile-card">
        <h2 className="profile-username">{user.username}</h2>
        <button className="add-friend-button" onClick={handleSendFriendRequest}>
          Send Friend Request
        </button>
      </div>
    </div>
  );
};

export default UserProfileCard;
