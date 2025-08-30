import React from "react";
import { useChat } from "../../context/ChatContext";
import { Link } from "react-router-dom";
import ConversationItem from "./ConversationItem";
import "./Sidebar.css";

const Sidebar = () => {
  const {
    onlineUsers,
    selectedUser,
    handleLogout,
    handleSelectedUser,
    onlineFriends,
    searchUser,
    setSearchUser,
    searchClicked,
    setSearchClicked,
    searchPeople,
    searchResult,
  } = useChat();

  const displayUsers =
    onlineUsers.length > 0
      ? onlineUsers
      : [
          {
            _id: 1,
            username: "Add some friends to chat",
          },
        ];

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <div className="sidebar-searchbar">
          <input
            type="text"
            placeholder="Search for people..."
            value={searchUser}
            onChange={searchPeople}
            onClick={() => {
              setSearchClicked((searchClicked) => !searchClicked);
            }}
            className="searchbar-input"
          />
          {searchClicked && (
            <div className="search-people-result">
              {searchResult.length > 0 ? (
                (() => {
                  const searchedFriends = searchResult.filter((user) =>
                    onlineUsers.some((friend) => friend._id === user._id)
                  );

                  const globalUsers = searchResult.filter(
                    (user) =>
                      !onlineUsers.some((friend) => friend._id === user._id)
                  );

                  return (
                    <ul className="searchbar-result-list">
                      {searchedFriends.length > 0 && (
                        <>
                          <p className="searchbar-friendtag">Friends</p>
                          {searchedFriends.map((user) => {
                            return (
                              <li
                                className="searchbar-list-item"
                                onClick={() => {
                                  handleSelectedUser(user);
                                  setSearchClicked(false);
                                  setSearchUser("");
                                }}
                              >
                                {user.username}
                              </li>
                            );
                          })}
                        </>
                      )}

                      {globalUsers.length > 0 && (
                        <>
                          <p className="searchbar-globaluserstag">
                            Global Users
                          </p>
                          {globalUsers.map((user) => (
                            <Link
                              key={user._id}
                              to={`/profile/${user._id}`}
                              onClick={() => setSearchClicked(false)}
                            >
                              <li className="searchbar-list-item">
                                {user.username}
                              </li>
                            </Link>
                          ))}
                        </>
                      )}
                    </ul>
                  );
                })()
              ) : (
                <div className="sidebar-usernotfound">user not found</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="conversation-list">
        {displayUsers.map((user) => (
          <ConversationItem
            key={user._id}
            user={user}
            isSelected={selectedUser?._id === user._id}
            onClick={() => handleSelectedUser(user)}
            isOnline={onlineFriends.includes(user._id)}
          />
        ))}
      </div>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
