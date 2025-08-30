import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./UserProfileCard.css";

const UserProfileCard = ({ user }) => {
  const handleSendFriendRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = user._id;
      const url = `http://localhost:5000/api/user/profile/friend-request/${userId}`;
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
