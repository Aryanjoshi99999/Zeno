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

// testing
import { jwtDecode } from "jwt-decode";

//

const ChatContext = createContext();

// slow error
export const useChat = () => {
  return useContext(ChatContext);
};

// testing
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const apiClient = axios.create({ baseURL: backendUrl });

//

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

  //testing
  const [chatIds, setChatIds] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [userChatMap, setUserChatMap] = useState({});
  const [userIdUnrcMap, setUserIdUnrcMap] = useState({});

  //

  //testing
  const [cChat, setCChat] = useState();
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  //

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

    const chat = localStorage.getItem("cChat");
    if (chat) {
      setCChat(JSON.parse(chat));
    }
  }, []);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
    }
    if (!token) {
      if (socket) socket.disconnect();
      setSocket(null);
      setLogin(false);
      return;
    }
    setLogin(true);
    const newSocket = io(backendUrl, { auth: { token } });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Socket connected");

      fetchChats();
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

    newSocket.on("all_unread_counts", (counts) => {
      setUnreadCounts(counts);
    });
    return () => {
      newSocket.off("user-online");
      newSocket.off("user-offline");
      newSocket.off("all_unread_counts");
      newSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setCurrentUser({ _id: decodedToken.id });
    } else {
      setCurrentUser(null);
    }
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

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === msg.chatId
            ? { ...chat, lastMessage: msg } // Update the latestMessage
            : chat
        )
      );

      if (msg.chatId === chatId) {
        setMessages((prev) => [...prev, msg]);
      }
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
    const handleUnreadMessagesCount = ({ chatId, newCount }) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: newCount,
      }));
    };

    socket.on("new_message", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("unread_count_update", handleUnreadMessagesCount);

    return () => {
      socket.off("new_message", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("unread_count_update", handleUnreadMessagesCount);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket) return;

    const handleChatUpdated = (updatedChat) => {
      setChats((prevChats) => {
        const exists = prevChats.find((chat) => chat._id === updatedChat._id);
        let newChats;

        if (exists) {
          newChats = prevChats.map((chat) =>
            chat._id === updatedChat._id ? updatedChat : chat
          );
        } else {
          newChats = [updatedChat, ...prevChats];
        }

        return newChats.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    socket.on("chat_updated", handleChatUpdated);

    return () => socket.off("chat_updated", handleChatUpdated);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("get_all_unread_counts");
  }, [socket]);

  useEffect(() => {
    if (!socket || !token || !selectedUser || !cChat) return;
    handleSelectedUser(cChat, selectedUser);
  }, [socket, token, selectedUser, cChat]);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    }
    if (chatId) {
      localStorage.setItem("chatId", chatId);
    }
    if (cChat) {
      localStorage.setItem("cChat", JSON.stringify(cChat));
    }
  }, [selectedUser, chatId, cChat]);

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await apiClient.get("/api/user/chats");

      setChats(data);
      console.log(data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/api/user/login", {
        email,
        password,
      });
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
      const response = await apiClient.post("/api/user/register", {
        username,
        email,
        password,
      });
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
    async (chat, friend) => {
      if (!socket || !token) return;
      console.log("chat is:", chat);
      setSelectedUser(friend);
      setCChat(chat);
      setMessages([]);
      try {
        if (chatId) socket.emit("leave_chat", chatId);

        const newChatId = chat._id;

        if (newChatId) {
          socket.emit("active_chat_open", { chatId: newChatId });
          socket.emit("mark_chat_read", { chatId: newChatId });
        } else {
          console.log("new chat id is not present");
        }

        setUnreadCounts((prev) => ({ ...prev, [newChatId]: 0 }));
        setChatId(newChatId);
        console.log("Friend system", friend);

        const mesRes = await apiClient.get(
          `/api/user/getMessages?recipientId=${friend?._id}`
        );
        console.log(mesRes);

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
    if (!chatId) {
      alert("Missing chat ID ");
      return;
    }
    if (!socket) {
      alert("Missing socket");
      return;
    }
    if (!message) {
      alert("Missing message");
      return;
    }
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
      const res = await apiClient.get(
        `/api/user/getMessages?recipientId=${recipientId}&cursorObjId=${cursorObj}`
      );
      console.log("medium");

      const newMessages = res.data.messages.reverse();

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
    const data = await apiClient.get("/api/user/get-status");
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
        const response = await apiClient.get(
          `/api/user/find-user?pattern=${query}`
        );
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
    unreadCounts,
    userChatMap,
    userIdUnrcMap,
    chats,
    currentUser,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
