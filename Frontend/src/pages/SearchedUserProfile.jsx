import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import UserProfileCard from "../components/UserProfileCard/UserProfileCard";
import "./SearchedUserProfile.css";

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
        const url = `http://localhost:5000/api/user/profile/${userId}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
