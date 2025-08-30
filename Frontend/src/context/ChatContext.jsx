import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import axios from "axios";

const ChatContext = createContext();

// slow error
export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(null);
  const [login, setLogin] = useState(() => !!localStorage.getItem("token"));
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]); // online friends
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [cursorObj, setCursorObj] = useState();
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesRef = useRef();
  const typingTimeoutRef = useRef(null);
  const [searchUser, setSearchUser] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const searchTimeoutRef = useRef(null);
  const [searchClicked, setSearchClicked] = useState(false);

  // Socket Connection Effect

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
    }
  }, []);

  useEffect(() => {
    if (!token) {
      if (socket) socket.disconnect();
      setSocket(null);
      setLogin(false);
      return;
    }
    setLogin(true);
    const newSocket = io("http://localhost:5000", { auth: { token } });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Socket connected");
      getUserFriends();
      getOnlineStatus();
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
        prevFriends.filter((id) => id !== userId)
      );
    });
    return () => {
      newSocket.off("user-online");
      newSocket.off("user-offline");
      newSocket.disconnect();
    };
  }, [token]);

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

      if (msg.chatId !== chatId) return;

      setMessages((prev) => [...prev, msg]);
    };

    const handleTyping = ({ typingChatId, userId, username }) => {
      if (typingChatId !== chatId) return;
      setTypingUsers((prev) => {
        if (!prev.some((user) => user.userId === userId)) {
          return [...prev, { userId, username }];
        }
        return prev;
      });
    };

    const handleStopTyping = ({ typingChatId, userId }) => {
      if (typingChatId !== chatId) return;
      setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
    };

    socket.on("new_message", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("new_message", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket || !token || !selectedUser) return;
    handleSelectedUser(selectedUser);
  }, [socket, token, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    }
    if (chatId) {
      localStorage.setItem("chatId", chatId);
    }
  }, [selectedUser, chatId]);

  // Handler Functions

  const getUserFriends = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/user/online-users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOnlineUsers(data);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/user/login",
        { email, password }
      );
      const newToken = response.data.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } catch (err) {
      console.error("Login error:", err);
      alert(`Login failed: ${err.message}`);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/user/register",
        { username, email, password }
      );
      const newToken = response.data.data.token;
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } catch (err) {
      console.error("Registration error:", err);
      alert(
        `Registration failed: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("selectedUser");
    localStorage.removeItem("chatId");
    setToken(null);
  };

  const handleSelectedUser = useCallback(
    async (user) => {
      if (!socket || !token) return;

      setSelectedUser(user);
      setMessages([]);
      try {
        if (chatId) socket.emit("leave_chat", chatId);
        const res = await axios.post(
          "http://localhost:5000/api/user/access-chat-or-create",
          { recipientId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newChatId = res.data.chatId;
        setChatId(newChatId);
        const mesRes = await axios.get(
          `http://localhost:5000/api/user/getMessages?recipientId=${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const reversedMessages = mesRes.data.messages.reverse();
        setMessages(reversedMessages);
        socket.emit("join_chat", newChatId);

        if (reversedMessages.length > 0) {
          setCursorObj(reversedMessages[0]._id);
        } else {
          setCursorObj(null);
        }
      } catch (error) {
        console.error("Error selecting user:", error);
      }
    },
    [socket, token, chatId]
  );

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
    console.log("started");
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
      console.log("medium");

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
      console.log("ended");
    } catch (err) {
      console.error("Failed to fetch older messages:", err.message);
    }
    console.log("ended");
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!socket || !chatId) return;

    socket.emit("typing", { chatId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { chatId });
    }, 500);
  };

  const getTypingMessage = () => {
    if (typingUsers.length === 0) {
      return null;
    }
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    }
    const userNames = typingUsers.map((user) => user.username).join(", ");
    return `${userNames} are typing...`;
  };

  async function getOnlineStatus() {
    const data = await axios.get("http://localhost:5000/api/user/get-status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(data);
    const insert = data.data;
    setOnlineFriends(insert);
  }

  const searchPeople = async (e) => {
    const query = e.target.value;
    setSearchUser(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim() === "") {
      setSearchResult([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `http://localhost:5000/api/user/find-user?pattern=${query}`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSearchResult(response.data.matchedUsers || []);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setSearchResult([]);
        } else {
          console.error("Failed to search for users:", error);
        }
      }
    }, 300);
  };

  const value = {
    login,
    token,
    username,
    setUserName,
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
    handleRegisterSubmit,
    handleLogout,
    onlineUsers,
    selectedUser,
    setSelectedUser,
    handleSelectedUser,
    messages,
    message,
    setMessage,
    sendMessage,
    handleScroll,
    messagesRef,
    handleInputChange,
    getTypingMessage,
    onlineFriends,

    searchUser,
    setSearchUser,
    searchClicked,
    setSearchClicked,
    searchPeople,
    searchResult,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
