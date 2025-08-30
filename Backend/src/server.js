const express = require("express");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { client, pubClient, subClient } = require("./config/redis");
const userRouter = require("./routes/userRoute");
require("dotenv").config();
const User = require("./models/User");
const Chat = require("./models/Chat");
const Message = require("./models/Message");

const { createAdapter } = require("@socket.io/redis-adapter");

const app = express();
const port = process.env.PORT;

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// adapter for pub/sub
io.adapter(createAdapter(pubClient, subClient));

// JWT Authentication Middleware for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication token required"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log(`User ${userId} connected with socket ${socket.id}`);

  try {
    const user = await User.findById(userId).select("username").lean();
    if (user) {
      socket.username = user.username;
    }
  } catch (error) {
    console.error("Could not fetch user for username:", error);
  }
  // this code is for notification for the user : eg => friend request by user x
  socket.join(userId);

  // Join all chat rooms the user is part of
  try {
    const userChats = await Chat.find({ participants: userId });
    userChats.forEach((chat) => {
      socket.join(chat._id.toString());
      console.log(
        `User ${userId} joined pre-existing chat room ${chat._id.toString()}`
      );
    });
  } catch (error) {
    console.error("Could not join user to their chats on connection:", error);
  }

  // Set user status to online in DB and Redis
  await User.findByIdAndUpdate(userId, { status: "online" });
  await client.sAdd("online:users", userId);

  // Notify friends that the user is online
  try {
    const user = await User.findById(userId).select("friends").lean();
    if (user && user.friends) {
      user.friends.forEach((friendId) => {
        io.to(friendId.toString()).emit("user-online", { userId });
      });
    }
  } catch (error) {
    console.error("Could not notify friends of online status:", error);
  }

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  // testing
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${userId} left chat room ${chatId}`);
  });
  //

  socket.on("send_message", async ({ chatId, content, type }) => {
    const senderId = socket.userId;

    try {
      const message = await Message.create({
        chatId,
        sender: senderId,
        content,
        type,
      });

      const fullMessage = await message.populate("sender", "username _id");

      const key = `messages:${chatId}`;
      await client.lPush(key, JSON.stringify(fullMessage));
      await client.lTrim(key, 0, 99);
      console.log(fullMessage);
      io.to(chatId).emit("new_message", fullMessage);
      console.log(`Message sent to room ${chatId}`);
    } catch (error) {
      console.error("Failed to send message:", error);

      socket.emit("send_message_error", {
        error: "Message could not be sent.",
      });
    }
  });

  //typing
  socket.on("typing", ({ chatId }) => {
    socket.broadcast.to(chatId).emit("typing", {
      typingChatId: chatId,
      username: socket.username,
      userId: socket.userId,
    });
  });

  socket.on("stop_typing", ({ chatId }) => {
    socket.broadcast.to(chatId).emit("stop_typing", {
      typingChatId: chatId,
      userId: socket.userId,
    });
  });

  //

  socket.on("logout", () => {
    socket.disconnect(true);
  });

  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected`);

    await User.findByIdAndUpdate(userId, { status: "offline" });
    await client.sRem("online:users", userId);

    try {
      const user = await User.findById(userId).select("friends").lean();
      if (user && user.friends) {
        user.friends.forEach((friendId) => {
          io.to(friendId.toString()).emit("user-offline", { userId });
        });
      }
    } catch (error) {
      console.error("Could not notify friends of offline status:", error);
    }
  });
});

// API endpoints
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

server.listen(port, () => {
  console.log(`Server is started on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await pubClient.quit();
  await subClient.quit();
  await client.quit();
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});
