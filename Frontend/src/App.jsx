import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./App.css";

function App() {
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);

  // testing
  // const [senderId, setSenderId] = useState();
  // const [sender, setSender] = useState();
  const [cursorObj, setCursorObj] = useState();
  const messagesRef = useRef();

  // when the App component mounts it checks for the token, saved user
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setLogin(true);
    }
    const savedUser = localStorage.getItem("selectedUser");
    if (savedUser) {
      setSelectedUser(JSON.parse(savedUser));
    }

    const chatId = localStorage.getItem("chatId");
    if (chatId) {
      setChatId(chatId);
      //testing
      // doubt: as this is on top, the socket my never be available so the
      // user is never be able to join the room
      // if (socket) {
      //   console.log("the user joined the room:" + chatId);
      //   socket.emit("join_chat", chatId);
      // }
      //
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const newSocket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected");
      getUserFriends();
      //testing
      getOnlineStatus();
      const storedChatId = localStorage.getItem("chatId");
      if (storedChatId) {
        newSocket.emit("join_chat", storedChatId);
      }
      // testing

      const savedUserString = localStorage.getItem("selectedUser");
      if (savedUserString && chatId) {
        const savedUser = JSON.parse(savedUserString);
        handleSelectedUser(savedUser);
      }

      //

      //
    });

    newSocket.on("user-online", ({ userId }) => {
      setOnlineFriends((prevFriends) => {
        if (!prevFriends.includes(userId)) {
          return [...prevFriends, userId];
        }
        return prevFriends;
      });
    });

    newSocket.on("user-offline", ({ userId }) => {
      setOnlineFriends((prevFriends) =>
        // Filter out the friend who went offline
        prevFriends.filter((id) => id !== userId)
      );
    });

    return () => {
      // testing
      newSocket.off("user-online");
      newSocket.off("user-offline");
      newSocket.off("new message");
      newSocket.disconnect();
      //
    };
  }, [token]);

  // not good i guess
  useEffect(() => {
    if (!socket) {
      console.log("no socket is connected");
      return;
    }
    const handleMessage = async (msg) => {
      if (!socket || !chatId || !token) {
        console.log("Waiting for socket/chatId/token to be ready");
        return;
      }
      //tesing : route to push the message in the list(of the users messages:<chatId>)
      console.log("App.jsx the message is received");
      console.log("updating in the list");

      // try {
      //   const url = `http://localhost:5000/api/user/list-updator/${msg.chatId}`;

      //   await axios.post(
      //     url,
      //     { message: msg },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     }
      //   );
      // } catch (err) {
      //   console.error("Failed to update Redis list:", err.message);
      // }

      if (msg.chatId !== chatId) {
        console.log("Message is for another chat, skipping UI update");
        return;
      }

      console.log("App.jsx: setting up the message");

      setMessages(
        (prev) => [...prev, msg]
        // .sort(
        //   (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        // )
      );
    };

    console.log(messages);

    socket.on("new_message", handleMessage);

    return () => socket.off("new_message", handleMessage);
  }, [socket, chatId]);

  //

  // const handleMessage = async (msg) => {
  //   if (!socket) {
  //     console.log("socket is not present");
  //   }
  //   if (!chatId) {
  //     console.log("chatId is not present");
  //   }
  //   if (!token) {
  //     console.log("token  is not present");
  //   }
  //   if (!socket || !chatId || !token) return;

  //   //tesing : route to push the message in the list(of the users messages:<chatId>)
  //   console.log("App.jsx the message is received");
  //   console.log("updating in the list");

  //   try {
  //     const url = `http://localhost:5000/api/user/list-updator/${msg.chatId}`;

  //     const res = await axios.post(
  //       url,
  //       { message: msg },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //   } catch (err) {
  //     console.error("Failed to update Redis list:", err.message);
  //   }

  //   if (msg.chatId !== chatId) {
  //     console.log("Message is for another chat, skipping UI update");
  //     return;
  //   }

  //   console.log("App.jsx: setting up the message");

  //   setMessages(
  //     (prev) => [...prev, msg]
  //     // .sort(
  //     //   (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  //     // )
  //   );
  // };

  // newsocket.on("new_message", handleMessage);

  useEffect(() => {
    // may be there could be a problem?
    if (chatId && socket) {
      console.log("✅ Joining chat room:", chatId);
      socket.emit("join_chat", chatId);
    }
  }, [chatId, socket]);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser && token && socket) {
      handleSelectedUser(selectedUser);
    }
  }, [selectedUser, token, socket]);

  // useEffect(() => {
  //   if (!socket) return;

  //   // const mesres = axios.get(
  //   //   `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}`,

  //   //   {
  //   //     headers: {
  //   //       Authorization: `Bearer ${token}`,
  //   //     },
  //   //   }
  //   // );
  //   setMessages(mesres.data.messages);
  // }, [messages]);

  async function getUserFriends() {
    const data = await axios.get(
      "http://localhost:5000/api/user/online-users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(data);
    setOnlineUsers(data.data);
  }

  // testing
  async function getOnlineStatus() {
    const data = await axios.get("http://localhost:5000/api/user/get-status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(data);
    const insert = data.data;
    console.log(insert);
    setOnlineFriends(insert);
  }
  //

  // testing

  // async function getPonlineUsersId() {
  //   const data =
  // }

  //
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/user/login",
        {
          email,
          password,
        }
      );

      const newToken = response.data.data.token;
      setLogin(true);

      setToken(newToken);

      localStorage.setItem("token", newToken);

      alert("Login successful");
    } catch (err) {
      console.error("Login error:", err.message);
      alert(`Login failed: ${err.message}`);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    try {
      if (socket) {
        socket.emit("logout");
        socket.disconnect();
      }

      localStorage.removeItem("token");
      localStorage.removeItem("chatId");
      localStorage.removeItem("selectedUser");
      setSelectedUser(null);
      setToken(null);
      setLogin(false);
      setSocket(null);
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  const getUserName = (id) => {
    const user = onlineUsers.find((user) => user._id === id);

    return user ? user.username : "You";
  };

  const handleSelectedUser = async (user) => {
    const recipientId = user._id;

    setSelectedUser(user);
    setMessages([]);

    setCursorObj("");

    const res = await axios.post(
      "http://localhost:5000/api/user/access-chat-or-create",
      { recipientId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const chatId = res.data.chatId;
    setChatId(chatId);
    localStorage.setItem("chatId", chatId);
    //testing
    console.log("the user joined the after user switch");
    socket.emit("join_chat", chatId);
    //
    let url = `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}`;

    const mesres = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const reversedMessages = [...mesres.data.messages].reverse();
    setMessages(reversedMessages);

    if (reversedMessages.length > 0) {
      setCursorObj(reversedMessages[0]._id);
    }
  };

  const sendMessage = async () => {
    // testing
    console.log("Trying to send message");
    console.log("chatId:", chatId);
    console.log("message:", message);
    console.log("socket connected?", socket?.connected);

    //
    if (!chatId || !message.trim() || !socket) {
      alert("Missing chat ID or message.");
      return;
    }

    socket.emit("send_message", {
      chatId,
      content: message,
      type: "text",
    });
    console.log("erasing the message");
    setMessage("");
  };

  const handleScroll = async () => {
    const div = messagesRef.current;
    if (!div || div.scrollTop !== 0 || !cursorObj || !selectedUser) return;

    try {
      const recipientId = selectedUser._id;
      let url = `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}&cursorObjId=${cursorObj}`;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(res);
      const newMessages = res.data.messages.reverse();

      console.log(newMessages);
      if (newMessages.length === 0) return;

      const prevHeight = div.scrollHeight;
      console.log(prevHeight);

      setMessages((prevMessages) => [...newMessages, ...prevMessages]);

      setTimeout(() => {
        const newHeight = div.scrollHeight;
        div.scrollTop = newHeight - prevHeight;
        console.log(div.scrollTop);
      }, 0);

      const newOldest = newMessages[0];
      if (newOldest) {
        setCursorObj(newOldest._id);
      }
    } catch (err) {
      console.error("Failed to fetch older messages:", err.message);
    }
  };
  return (
    <div className="app-container">
      {login ? (
        <div className="logged-in">
          <ul>
            {onlineUsers.map((user) => {
              const isOnline = onlineFriends.includes(user._id);

              return (
                <li key={user._id} onClick={() => setSelectedUser(user)}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      marginRight: "8px",
                      backgroundColor: isOnline ? "green" : "gray",
                    }}
                  ></span>
                  {user.username}
                </li>
              );
            })}
          </ul>
          {selectedUser ? (
            <div className="Selected-User">
              <div className="Selected-User-Username">
                {selectedUser.username}
              </div>
              <div
                className="Messages"
                onScroll={handleScroll}
                ref={messagesRef}
                style={{ overflowY: "scroll", maxHeight: "400px" }}
              >
                {messages.map((msg, i) => (
                  <div key={i}>
                    <strong>{getUserName(msg.sender._id)}:</strong>{" "}
                    {msg.content}
                  </div>
                ))}
                {/* {messages} */}
              </div>

              <div className="Selected-User-MessageBox">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          ) : (
            <div>kindly select a user to communicate </div>
          )}

          <button type="submit" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      )}
    </div>
  );
}

export default App;
