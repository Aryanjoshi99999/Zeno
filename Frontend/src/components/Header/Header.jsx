import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/Zeno.png";
import { useChat } from "../../context/ChatContext";

const Header = () => {
  const { login } = useChat();
  return (
    <div className="header-container">
      <div className="header-container-main">
        <div className="header-left">
          <span className="header-container-name">Zeno</span>
          <img src={logo} alt="Zeno Logo" className="header-container-logo" />
        </div>

        {login && (
          <div className="header-container-friend-requests">
            <Link to="/friendRequests" className="friend-requests">
              Friend-Requests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
