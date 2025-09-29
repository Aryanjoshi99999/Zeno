import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import FriendRequestsContainer from "../components/FriendRequestsContainer/FriendRequestsContainer";

import apiClient from "../apiClient";
import { useChat } from "../context/ChatContext";

const FriendRequests = () => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthReady } = useChat();

  useEffect(() => {
    const getFriendRequests = async () => {
      try {
        const response = await apiClient.get("/api/user/get-friend-requests");
        setFriendRequests(response.data.friendRequestsUserData);
      } catch (err) {
        console.error("Failed to load friend requests:", err);
        setError(
          err.response?.data?.message || "Could not load friend requests."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthReady) {
      getFriendRequests();
    }
  }, [isAuthReady]);

  const handleRequestAccepted = (userId) => {
    setFriendRequests((currentRequests) =>
      currentRequests.filter((user) => user._id !== userId)
    );
  };

  if (isLoading)
    return <div className="Friend-Requests-Container">Loading...</div>;
  if (error)
    return <div className="Friend-Requests-Container">Error: {error}</div>;
  return (
    <div className="FriendRequests">
      <FriendRequestsContainer
        friendRequests={friendRequests}
        onRequestAccepted={handleRequestAccepted}
      />
    </div>
  );
};

export default FriendRequests;
