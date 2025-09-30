import React from "react";
import axios from "axios";
import "./FriendRequestsContainer.css";
import apiClient from "../../apiClient";

// will the friend Req will be gone after accepting?
const FriendRequestsContainer = ({ friendRequests, onRequestAccepted }) => {
  const acceptFriendRequest = async (user) => {
    const id = user._id;

    const response = await apiClient.post(`/api/user/accept-request/${id}`);

    if (response.data.msg) {
      alert(response.data.msg);

      onRequestAccepted(id);
    }
  };
  return (
    <div className="Friend-Requests-Container">
      {friendRequests.map((user) => {
        return (
          <div key={user._id} className="Friend-Requests-User">
            <h2 className="Friend-Requests-Username">{user.username}</h2>
            <button
              className="Friend-Requests-User-button"
              onClick={() => {
                acceptFriendRequest(user);
              }}
            >
              Accept Friend Request
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FriendRequestsContainer;
