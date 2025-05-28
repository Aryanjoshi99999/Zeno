import { useState, useEffect } from "react";
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
      console.log("Connected to server");
      console.log("Socket connected with ID:", newSocket.id);

      getOnlineUsers();
    });

    newSocket.on("user-online", ({ userId }) => {
      console.log(`${userId} came online`);
      console.log("Socket connected with ID:", newSocket.id);
      getOnlineUsers();
    });

    newSocket.on("user-offline", ({ userId }) => {
      console.log(`${userId} went offline`);
      getOnlineUsers();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      console.log("disconnected");
    };
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setLogin(true);
    }
  }, []);

  async function getOnlineUsers() {
    const data = await axios.get(
      "http://localhost:5000/api/user/online-users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // return (
    //   <ul>
    //     {data.map((user, index) => {
    //       <li key={index}>{user}</li>;
    //     })}
    //   </ul>
    // );
    //)
    setOnlineUsers(data.data);
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

      setLogin(true);

      // const data = await response.json();
      const newToken = response.data.data.token;

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
        socket.disconnect();
      }

      localStorage.removeItem("token");
      setToken(null);
      setLogin(false);
      setSocket(null);

      console.log("Logout successful");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };
  return (
    <div className="app-container">
      {login ? (
        <div className="logged-in">
          <ul>
            {onlineUsers.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>

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
