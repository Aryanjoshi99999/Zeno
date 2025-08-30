import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/Zeno.png";
const Header = () => {
  return (
    <div className="header-container">
      <div className="header-container-main">
        <img src={logo} className="header-container-logo" />

        <div className="header-container-friend-requests">
          <Link
            to={`/friendRequests`}
            className="friend-requests"
            onClick={() => setSearchClicked(false)}
          >
            Friend-Requests
          </Link>
        </div>
        {/* {will add the profile viewer} */}
      </div>
    </div>
  );
};

export default Header;
