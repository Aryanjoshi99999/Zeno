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

  // testing
  // const [senderId, setSenderId] = useState();
  // const [sender, setSender] = useState();
  const [cursorObj, setCursorObj] = useState();
  const messagesRef = useRef();

  useEffect(() => {
    if (!token) {
      return;
    }
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    newSocket.on("connect", () => {
      // console.log("Connected to server");
      // console.log("Socket connected with ID:", newSocket.id);

      getOnlineUsers();
    });

    newSocket.on("user-online", ({ userName }) => {
      // console.log(`${userName} came online`);
      // console.log("Socket connected with ID:", newSocket.id);
    });

    newSocket.on("user-offline", ({ userName }) => {
      // console.log(`${userName} went offline`);
    });

    // })

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      // console.log("disconnected");
      getOnlineUsers();
    };
  }, [token]);

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

    //testing D-12
    // if (messages.length > 0) {
    //   const oldest = messages[messages.length - 1];
    //   console.log("this is oldest:" + oldest);
    //   setCursorObj(oldest);
    // }

    //
  }, []);

  // not good i guess
  useEffect(() => {
    if (!socket) return;

    // if(selectedUser){

    // }

    const handleMessage = (msg) => {
      // console.log("New message received", msg);
      setMessages((prev) =>
        [...prev, msg].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
      );
    };

    console.log(messages);

    socket.on("new_message", handleMessage);

    return () => socket.off("new_message", handleMessage);
  }, [socket]);

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

  async function getOnlineUsers() {
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
    console.log(onlineUsers);
  }

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

      // const data = await response.json();
      const newToken = response.data.data.token;
      setLogin(true);

      localStorage.setItem("token", newToken);

      setToken(newToken);

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
      setToken(null);
      setLogin(false);
      setSocket(null);

      // console.log("Logout successful");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  const getUserName = (id) => {
    //console.log(messages);
    const user = onlineUsers.find((user) => user._id === id);
    // console.log(user);
    return user ? user.username : "You";
  };

  // const handleSelectedUser = async (user) => {
  //   const recipientId = user._id;

  //   const res = await axios.post(
  //     "http://localhost:5000/api/user/access-chat-or-create",
  //     { recipientId },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   const mesres = await axios.get(
  //     `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}`,

  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   console.log(res);
  //   console.log(mesres);
  //   const chatId = res.data.chatId;
  //   setChatId(chatId);
  //   socket.emit("join_chat", chatId);
  //   setMessages(
  //     [...mesres.data.messages].sort(
  //       (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  //     )
  //   );
  //   // console.log("Chat ready with ID:", chatId);
  // };

  const handleSelectedUser = async (user) => {
    const recipientId = user._id;

    const res = await axios.post(
      "http://localhost:5000/api/user/access-chat-or-create",
      { recipientId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let url = `http://localhost:5000/api/user/getMessages?recipientId=${recipientId}`;
    // console.log("this is the cursorObj:" + cursorObj);
    if (cursorObj) {
      url += `&cursorObjId=${cursorObj}`;
    }

    // console.log(url);

    const mesres = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // console.log(res);
    // console.log(mesres);
    const chatId = res.data.chatId;
    setChatId(chatId);
    socket.emit("join_chat", chatId);
    const reversedMessages = [...mesres.data.messages].reverse();
    setMessages(reversedMessages);

    if (reversedMessages.length > 0) {
      setCursorObj(reversedMessages[0]._id);
    }
    // console.log("Chat ready with ID:", chatId);
  };

  const sendMessage = async () => {
    if (!chatId || !message.trim() || !socket) {
      alert("Missing chat ID or message.");
      return;
    }

    socket.emit("send_message", {
      chatId,
      content: message,
      type: "text",
    });

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
            {onlineUsers.map((user, index) => (
              <li key={user._id} onClick={() => setSelectedUser(user)}>
                {user.username} - {user.status}
              </li>
            ))}
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
