import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/Zeno.png";

const Header = () => {
  return (
    <div className="header-container">
      <div className="header-container-main">
        <div className="header-left">
          <span className="header-container-name">Zeno</span>
          <img src={logo} alt="Zeno Logo" className="header-container-logo" />
        </div>

        <div className="header-container-friend-requests">
          <Link to="/friendRequests" className="friend-requests">
            Friend-Requests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
