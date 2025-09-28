import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import UserProfileCard from "../components/UserProfileCard/UserProfileCard";
import "./SearchedUserProfile.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const apiClient = axios.create({ baseURL: backendUrl });

const SearchedUserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        const response = await apiClient.get(`/api/user/profile/${userId}`);
        setUser(response.data.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
        setError(
          err.response?.data?.message || "User not found or an error occurred."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  if (isLoading) return <div className="user-profilecard">Loading...</div>;
  if (error) return <div className="user-profilecard">Error: {error}</div>;

  return (
    <div className="user-profilecard-container">
      <UserProfileCard user={user} />
    </div>
  );
};

export default SearchedUserProfile;
