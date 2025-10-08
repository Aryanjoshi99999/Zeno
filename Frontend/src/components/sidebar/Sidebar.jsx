import React from "react";
import { useChat } from "../../context/ChatContext";
import { Link } from "react-router-dom";
import ConversationItem from "./ConversationItem";
import "./Sidebar.css";

const Sidebar = () => {
  const {
    chats,
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
    unreadCounts,
    userChatMap,
    userIdUnrcMap,
    currentUser,
    fetchFriends,
    usersFriends,
  } = useChat();

  // const displayUsers =
  //   onlineUsers.length > 0
  //     ? onlineUsers
  //     : [
  //         {
  //           _id: 1,
  //           username: "Add some friends to chat",
  //         },
  //       ];

  const searchClickedHandler = async () => {
    setSearchClicked((searchClicked) => !searchClicked);
  };

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
            onClick={searchClickedHandler}
            className="searchbar-input"
          />
          {searchClicked && (
            <div className="search-people-result">
              {searchResult.length > 0 ? (
                (() => {
                  const searchedFriends = searchResult.filter((user) =>
                    chats.some((chat) =>
                      chat.participants.find(
                        (p) => p._id === user._id && p._id !== currentUser._id
                      )
                    )
                  );

                  const globalUsers = searchResult.filter(
                    (user) =>
                      !usersFriends.some((friend) => friend._id === user._id) &&
                      user._id !== currentUser?._id
                  );

                  return (
                    <ul className="searchbar-result-list">
                      {searchedFriends.length > 0 && (
                        <>
                          <p className="searchbar-friendtag">Friends</p>
                          {searchedFriends.map((user) => {
                            const correspondingChat = chats.find((chat) =>
                              chat.participants.some((p) => p._id === user._id)
                            );
                            return (
                              <li
                                className="searchbar-list-item"
                                onClick={() => {
                                  handleSelectedUser(correspondingChat, user);
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
        {chats && chats.length > 0 ? (
          chats.map((chat) => {
            if (!currentUser) {
              console.log("no current user");
            }

            const friend = chat.participants.find(
              (p) => p._id !== currentUser._id
            );

            if (!friend) return null;

            const count = unreadCounts[chat._id] || 0;

            const lastMessage = chat.lastMessage?.content || "No message yet.";

            return (
              <ConversationItem
                user={friend}
                lastMessageSnippet={lastMessage}
                unrCount={count}
                isSelected={selectedUser?._id === friend._id}
                onClick={() => handleSelectedUser(chat, friend)}
                isOnline={onlineFriends.includes(friend._id)}
              />
            );
          })
        ) : (
          <div className="no-conversations">
            Add some friends to start chatting!
          </div>
        )}
      </div>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
