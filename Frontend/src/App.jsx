import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ChatProvider, useChat } from "./context/ChatContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import SearchedUserProfile from "./pages/SearchedUserProfile";
import FriendRequests from "./pages/FriendRequests";

function AppContent() {
  const { login } = useChat();

  return (
    <Routes>
      <Route
        path="/auth"
        element={!login ? <AuthPage /> : <Navigate to="/" />}
      />

      <Route
        path="/"
        element={login ? <ChatPage /> : <Navigate to="/auth" />}
      />
      <Route path="/profile/:userId" element={<SearchedUserProfile />} />
      <Route path="/friendRequests" element={<FriendRequests />} />
    </Routes>
  );
}

function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

export default App;

// import { useState, useEffect, useRef } from "react";
// import { Routes, Route, Link } from "react-router-dom";
// import { io } from "socket.io-client";
// import axios from "axios";
// import "./App.css";

// //testing
// import SearchedUserProfile from "./pages/SearchedUserProfile";
// import FriendRequests from "./pages/FriendRequests";
// //

// function App() {
//   const [socket, setSocket] = useState(null);
//   const [token, setToken] = useState(null);
//   const [username, setUserName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [login, setLogin] = useState(false);
//   const [onlineUsers, setOnlineUsers] = useState([]); // friends only
//   const [selectedUser, setSelectedUser] = useState();
//   const [message, setMessage] = useState("");
//   const [chatId, setChatId] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [onlineFriends, setOnlineFriends] = useState([]); // online friends
//   const [cursorObj, setCursorObj] = useState();
//   const messagesRef = useRef();
//   const [typingUsers, setTypingUsers] = useState([]);
//   const typingTimeoutRef = useRef(null);
//   const [registerUser, setRegisterUser] = useState(false);

//   // testing
//   const [searchUser, setSearchUser] = useState("");
//   const [searchResult, setSearchResult] = useState([]);
//   const searchTimeoutRef = useRef(null);
//   const [searchClicked, setSearchClicked] = useState(false);

//   //

//   // when the App component mounts it checks for the token, saved user
//   useEffect(() => {
//     const storedToken = localStorage.getItem("token");
//     if (storedToken) {
//       setToken(storedToken);
//       setLogin(true);
//     }
//     const savedUser = localStorage.getItem("selectedUser");
//     if (savedUser) {
//       setSelectedUser(JSON.parse(savedUser));
//     }

//     const chatId = localStorage.getItem("chatId");
//     if (chatId) {
//       setChatId(chatId);
//       //testing
//       // doubt: as this is on top, the socket my never be available so the
//       // user is never be able to join the room
//       // if (socket) {
//       //   console.log("the user joined the room:" + chatId);
//       //   socket.emit("join_chat", chatId);
//       // }
//       //
//     }
//   }, []);

//   useEffect(() => {
//     if (!token) {
//       return;
//     }

//     const newSocket = io("http://localhost:5000", {
//       auth: {
//         token: localStorage.getItem("token"),
//       },
//     });

//     setSocket(newSocket);

//     newSocket.on("connect", () => {
//       console.log("Socket connected");
//       getUserFriends();
//       //testing
//       getOnlineStatus();
//       const storedChatId = localStorage.getItem("chatId");
//       if (storedChatId) {
//         newSocket.emit("join_chat", storedChatId);
//       }
//       // testing

//       const savedUserString = localStorage.getItem("selectedUser");
//       if (savedUserString && chatId) {
//         const savedUser = JSON.parse(savedUserString);
//         handleSelectedUser(savedUser);
//       }

//       //

//       //
//     });

//     newSocket.on("user-online", ({ userId }) => {
//       setOnlineFriends((prevFriends) => {
//         if (!prevFriends.includes(userId)) {
//           return [...prevFriends, userId];
//         }
//         return prevFriends;
//       });
//     });

//     newSocket.on("user-offline", ({ userId }) => {
//       setOnlineFriends((prevFriends) =>
//         // Filter out the friend who went offline
//         prevFriends.filter((id) => id !== userId)
//       );
//     });

//     // testing
//     // newSocket.on("typing", ({ userId, username, tchatId }) => {
//     //   if (tchatId !== chatId) {
//     //     return;
//     //   }
//     //   setTypingUsers((prev) => {
//     //     // Add user only if they are not already in the list
//     //     if (!prev.some((user) => user.userId === userId)) {
//     //       return [...prev, { userId, username }];
//     //     }
//     //     return prev;
//     //   });
//     // });

//     // newSocket.on("stop_typing", ({ userId }) => {
//     //   setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
//     // });
//     // //

//     return () => {
//       // testing

//       newSocket.off("user-online");
//       newSocket.off("user-offline");
//       newSocket.off("new message");
//       newSocket.disconnect();
//       //
//     };
//   }, [token]);

//   // not good i guess
//   useEffect(() => {
//     if (!socket) {
//       console.log("no socket is connected");
//       return;
//     }
//     const handleMessage = async (msg) => {
//       if (!socket || !chatId || !token) {
//         console.log("Waiting for socket/chatId/token to be ready");
//         return;
//       }
//       //tesing : route to push the message in the list(of the users messages:<chatId>)
//       console.log("App.jsx the message is received");
//       console.log("updating in the list");

//       // try {
//       //   const url = `http://localhost:5000/api/user/list-updator/${msg.chatId}`;

//       //   await axios.post(
//       //     url,
//       //     { message: msg },
//       //     {
//       //       headers: {
//       //         Authorization: `Bearer ${token}`,
//       //       },
//       //     }
//       //   );
//       // } catch (err) {
//       //   console.error("Failed to update Redis list:", err.message);
//       // }

//       if (msg.chatId !== chatId) {
//         console.log("Message is for another chat, skipping UI update");
//         return;
//       }

//       console.log("App.jsx: setting up the message");

//       setMessages(
//         (prev) => [...prev, msg]
//         // .sort(
//         //   (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//         // )
//       );
//     };

//     //testing
//     const handleTyping = ({ userId, username }) => {
//       setTypingUsers((prev) => {
//         if (!prev.some((user) => user.userId === userId)) {
//           return [...prev, { userId, username }];
//         }
//         return prev;
//       });
//     };

//     const handleStopTyping = ({ userId }) => {
//       setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
//     };

//     //

//     console.log(messages);

//     socket.on("new_message", handleMessage);
//     socket.on("typing", handleTyping);
//     socket.on("stop_typing", handleStopTyping);

//     return () => {
//       socket.off("new_message", handleMessage);
//       socket.off("typing", handleTyping);
//       socket.off("stop_typing", handleStopTyping);
//     };
//   }, [socket, chatId]);

//   useEffect(() => {
//     // may be there could be a problem?
//     if (chatId && socket) {
//       console.log("✅ Joining chat room:", chatId);
//       socket.emit("join_chat", chatId);
//     }
//   }, [chatId, socket]);

//   useEffect(() => {
//     if (selectedUser) {
//       localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
//     }
//   }, [selectedUser]);

//   useEffect(() => {
//     if (selectedUser && token && socket) {
//       handleSelectedUser(selectedUser);
//     }
//   }, [selectedUser, token, socket]);

//   async function getUserFriends() {
//     const data = await axios.get(
//       "http://localhost:5000/api/user/online-users",
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     console.log(data);
//     setOnlineUsers(data.data);
//   }

//   // testing
//   async function getOnlineStatus() {
//     const data = await axios.get("http://localhost:5000/api/user/get-status", {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     console.log(data);
//     const insert = data.data;
//     console.log(insert);
//     setOnlineFriends(insert);
//   }
//   //

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/user/login",
//         {
//           email,
//           password,
//         }
//       );

//       const newToken = response.data.data.token;
//       setLogin(true);

//       setToken(newToken);

//       localStorage.setItem("token", newToken);

//       alert("Login successful");
//     } catch (err) {
//       console.error("Login error:", err.message);
//       alert(`Login failed: ${err.message}`);
//     }
//   };

//   const handleRegisterSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/user/register",
//         {
//           username,
//           email,
//           password,
//         }
//       );

//       const newToken = response.data.data.token;
//       setLogin(true);
//       setRegisterUser(false);
//       setToken(newToken);
//       localStorage.setItem("token", newToken);

//       alert("user registered successfully");
//     } catch (err) {
//       console.error("registration error:", err.message);

//       const message = err.response?.data?.message || "an unknow error occured";
//       alert(`registration failed: ${message}`);
//     }
//   };

//   const handleLogout = async (e) => {
//     e.preventDefault();

//     try {
//       if (socket) {
//         socket.emit("logout");
//         socket.disconnect();
//       }

//       localStorage.removeItem("token");
//       localStorage.removeItem("chatId");
//       localStorage.removeItem("selectedUser");
//       setSelectedUser(null);
//       setToken(null);
//       setLogin(false);
//       setSocket(null);
//     } catch (err) {
//       console.error("Logout error:", err.message);
//     }
//   };

//   const getUserName = (id) => {
//     const user = onlineUsers.find((user) => user._id === id);

//     return user ? user.username : "You";
//   };

//   const handleSelectedUser = async (user) => {
//     if (!socket) {
//       return;
//     }
//     if (chatId) {
//       socket.emit("leave_chat", chatId);
//     }

//     setTypingUsers([]);

//     const recipientId = user._id;

//     setSelectedUser(user);
//     setMessages([]);

//     setCursorObj("");

//     const res = await axios.post(
//       "http://localhost:5000/api/user/access-chat-or-create",
//       { recipientId },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const newChatId = res.data.chatId;
//     setChatId(newChatId);
//     localStorage.setItem("chatId", newChatId);
//     //testing
//     console.log("the user joined the after user switch");
//     socket.emit("join_chat", newChatId);
//     //
//     let url = `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}`;

//     const mesres = await axios.get(url, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const reversedMessages = [...mesres.data.messages].reverse();
//     setMessages(reversedMessages);

//     if (reversedMessages.length > 0) {
//       setCursorObj(reversedMessages[0]._id);
//     }
//   };

//   const sendMessage = async () => {
//     // testing
//     console.log("Trying to send message");
//     console.log("chatId:", chatId);
//     console.log("message:", message);
//     console.log("socket connected?", socket?.connected);

//     //
//     if (!chatId || !message.trim() || !socket) {
//       alert("Missing chat ID or message.");
//       return;
//     }

//     socket.emit("send_message", {
//       chatId,
//       content: message,
//       type: "text",
//     });
//     console.log("erasing the message");
//     setMessage("");
//   };

//   const handleScroll = async () => {
//     const div = messagesRef.current;
//     if (!div || div.scrollTop !== 0 || !cursorObj || !selectedUser) return;

//     try {
//       const recipientId = selectedUser._id;
//       let url = `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}&cursorObjId=${cursorObj}`;
//       const res = await axios.get(url, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       console.log(res);
//       const newMessages = res.data.messages.reverse();

//       console.log(newMessages);
//       if (newMessages.length === 0) return;

//       const prevHeight = div.scrollHeight;
//       console.log(prevHeight);

//       setMessages((prevMessages) => [...newMessages, ...prevMessages]);

//       setTimeout(() => {
//         const newHeight = div.scrollHeight;
//         div.scrollTop = newHeight - prevHeight;
//         console.log(div.scrollTop);
//       }, 0);

//       const newOldest = newMessages[0];
//       if (newOldest) {
//         setCursorObj(newOldest._id);
//       }
//     } catch (err) {
//       console.error("Failed to fetch older messages:", err.message);
//     }
//   };

//   //testing
//   const handleInputChange = (e) => {
//     setMessage(e.target.value);

//     if (!socket || !chatId) return;

//     socket.emit("typing", { chatId });

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       socket.emit("stop_typing", { chatId });
//     }, 500);
//   };

//   const getTypingMessage = () => {
//     if (typingUsers.length === 0) {
//       return null; // No one is typing
//     }
//     if (typingUsers.length === 1) {
//       return `${typingUsers[0].username} is typing...`;
//     }
//     // Handles multiple typists
//     const userNames = typingUsers.map((user) => user.username).join(", ");
//     return `${userNames} are typing...`;
//   };

//   const searchPeople = async (e) => {
//     const query = e.target.value;
//     setSearchUser(query);

//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     if (query.trim() === "") {
//       setSearchResult([]);
//       return;
//     }

//     searchTimeoutRef.current = setTimeout(async () => {
//       try {
//         const url = `http://localhost:5000/api/user/find-user?pattern=${query}`;
//         const response = await axios.get(url, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         // It's good practice to check if the response data exists
//         setSearchResult(response.data.matchedUsers || []);
//       } catch (error) {
//         // If the search returns 404 (no users found), clear results
//         if (error.response && error.response.status === 404) {
//           setSearchResult([]);
//         } else {
//           console.error("Failed to search for users:", error);
//         }
//       }
//     }, 300);
//   };

//   //
//   return (
//     <div className="app-container">
//       {login ? (
//         <Routes>
//           // the route for main chat
//           <Route
//             path="/"
//             element={
//               <div className="logged-in">
//                 <div className="search-people">
//                   <input
//                     type="text"
//                     placeholder="Search for people..."
//                     value={searchUser}
//                     onChange={searchPeople}
//                     onClick={() => setSearchClicked(true)}
//                   />
//                   {searchClicked && (
//                     <div className="search-people-result">
//                       {searchResult.length > 0 ? (
//                         (() => {
//                           const searchedFriends = searchResult.filter((user) =>
//                             onlineUsers.some(
//                               (friend) => friend._id === user._id
//                             )
//                           );

//                           const globalUsers = searchResult.filter(
//                             (user) =>
//                               !onlineUsers.some(
//                                 (friend) => friend._id === user._id
//                               )
//                           );

//                           return (
//                             <ul>
//                               {searchedFriends.length > 0 && (
//                                 <>
//                                   <p>Friends</p>
//                                   {searchedFriends.map((user) => {
//                                     return (
//                                       <li
//                                         onClick={() => {
//                                           handleSelectedUser(user);
//                                           setSearchClicked(false);
//                                           setSearchUser("");
//                                         }}
//                                       >
//                                         {user.username}
//                                       </li>
//                                     );
//                                   })}
//                                 </>
//                               )}

//                               {globalUsers.length > 0 && (
//                                 <>
//                                   <p>Global Users</p>
//                                   {globalUsers.map((user) => (
//                                     <Link
//                                       key={user._id}
//                                       to={`/profile/${user._id}`}
//                                       className="search-result-item"
//                                       onClick={() => setSearchClicked(false)} // Good idea to hide search on click
//                                     >
//                                       <li>{user.username}</li>
//                                     </Link>
//                                   ))}
//                                 </>
//                               )}
//                             </ul>
//                           );
//                         })()
//                       ) : (
//                         <div>user not found</div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//                 <Link
//                   to={`/friendRequests`}
//                   className="friend-requests"
//                   onClick={() => setSearchClicked(false)}
//                 >
//                   Friend-Requests
//                 </Link>
//                 <ul>
//                   {onlineUsers.map((user) => {
//                     const isOnline = onlineFriends.includes(user._id);

//                     return (
//                       <li key={user._id} onClick={() => setSelectedUser(user)}>
//                         <span
//                           style={{
//                             display: "inline-block",
//                             width: "10px",
//                             height: "10px",
//                             borderRadius: "50%",
//                             marginRight: "8px",
//                             backgroundColor: isOnline ? "green" : "gray",
//                           }}
//                         ></span>
//                         {user.username}
//                       </li>
//                     );
//                   })}
//                 </ul>
//                 {selectedUser ? (
//                   <div className="Selected-User">
//                     <div className="Selected-User-Username">
//                       {selectedUser.username}
//                     </div>
//                     //testing
//                     <div
//                       className="typing-indicator"
//                       style={{
//                         height: "20px",
//                         fontStyle: "italic",
//                         color: "grey",
//                       }}
//                     >
//                       {getTypingMessage()}
//                     </div>
//                     //
//                     <div
//                       className="Messages"
//                       onScroll={handleScroll}
//                       ref={messagesRef}
//                       style={{ overflowY: "scroll", maxHeight: "400px" }}
//                     >
//                       {messages.map((msg, i) => (
//                         <div key={i}>
//                           <strong>{getUserName(msg.sender._id)}:</strong>{" "}
//                           {msg.content}
//                         </div>
//                       ))}
//                       {/* {messages} */}
//                     </div>
//                     <div className="Selected-User-MessageBox">
//                       <input
//                         type="text"
//                         value={message}
//                         onChange={handleInputChange}
//                       />
//                       <button onClick={sendMessage}>Send</button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div>kindly select a user to communicate </div>
//                 )}

//                 <button type="submit" onClick={handleLogout}>
//                   Logout
//                 </button>
//               </div>
//             }
//           />
//           // route for Searched User UserProfile
//           <Route path="/profile/:userId" element={<SearchedUserProfile />} />
//           // route for loggedin User profile // route for friendRequests
//           <Route path="/friendRequests" element={<FriendRequests />} />
//         </Routes>
//       ) : registerUser ? (
//         <form onSubmit={handleRegisterSubmit} className="register_user">
//           <div className="register_user_heading">Login</div>
//           <input
//             type="text"
//             placeholder="username"
//             value={username}
//             onChange={(e) => setUserName(e.target.value)}
//             required
//           />
//           <input
//             type="email"
//             placeholder="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//           <input
//             type="password"
//             placeholder="set your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />

//           <button type="submit">Register</button>
//           <p>
//             Already have an account?{" "}
//             <span
//               className="form-toggle"
//               onClick={() => setRegisterUser(false)}
//             >
//               Login
//             </span>
//           </p>
//         </form>
//       ) : (
//         <form onSubmit={handleSubmit} className="log_in_user">
//           <div className="log_in_user_heading">Login</div>
//           <input
//             type="email"
//             placeholder="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//           <button type="submit">Login</button>
//           <p>
//             Don't have an account?{" "}
//             <span className="form-toggle" onClick={() => setRegisterUser(true)}>
//               Register
//             </span>
//           </p>
//         </form>
//       )}
//     </div>
//   );
// }

// export default App;
