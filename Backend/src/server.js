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

  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${userId} left chat room ${chatId}`);
  });

  socket.on("send_message", async ({ chatId, content, type }) => {
    const senderId = socket.userId;

    try {
      const message = await Message.create({
        chatId,
        sender: senderId,
        content,
        type,
      });

      // testing

      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
      });

      const updatedChat = await Chat.findById(chatId)
        .populate("participants", "username status")
        .populate("lastMessage")
        .lean();
      console.log("updated chat", updatedChat);

      io.to(chatId).emit("chat_updated", updatedChat);

      //

      const fullMessage = await message.populate("sender", "username _id");

      const key = `messages:${chatId}`;
      await client.lPush(key, JSON.stringify(fullMessage));
      await client.lTrim(key, 0, 99);
      // console.log(fullMessage);
      io.to(chatId).emit("new_message", fullMessage);
      console.log(`Message sent to room ${chatId}`);

      // testing
      // basically with the help of chatId we will get the receipient id or ids
      console.log("testing the unread message thing");
      const chat = await Chat.findById(chatId).select("participants");
      // console.log("chat: " + chat);
      chat.participants.forEach(async (id) => {
        if (id.toString() != senderId) {
          const ackey = `active_chat:${id.toString()}`; // need the the receipient's id
          const activeChatId = await client.get(ackey); //
          console.log("activeChatId " + activeChatId);
          if (activeChatId != chatId) {
            const uncKey = `unread_counts:${id.toString()}`;
            const newCount = await client.hIncrBy(uncKey, chatId, 1);
            io.to(id.toString()).emit("unread_count_update", {
              chatId,
              newCount,
            });
            console.log(newCount);
          }
        }
        console.log("end fo the unread thing");
      });

      // if the activeChatId != chatId then need to increment the unread_message_counter:<chatId> <userId> count
      // then we will send this to the recipient's ui so that it can update according to chatId , the no. of unread
      // messages per chatId

      //
    } catch (error) {
      console.error("Failed to send message:", error);

      socket.emit("send_message_error", {
        error: "Message could not be sent.",
      });
    }
  });

  // testing
  socket.on("get_all_unread_counts", async () => {
    console.log("get all unread counts is getting triggered");
    const unreadCountKey = `unread_counts:${userId}`;
    const counts = await client.hGetAll(unreadCountKey);
    console.log("Before counts", counts);
    Object.keys(counts).forEach((key) => {
      counts[key] = parseInt(counts[key], 10);
    });
    console.log("after counts", counts);

    socket.emit("all_unread_counts", counts || {});
    console.log("get all unread counts");
  });

  socket.on("mark_chat_read", async ({ chatId }) => {
    if (!chatId) {
      return console.log("mark_chat_read event received without a chatId.");
    }
    const unreadCountKey = `unread_counts:${userId}`;
    await client.hSet(unreadCountKey, chatId, 0);
    console.log("make the chat read");
  });

  socket.on("active_chat_open", ({ chatId }) => {
    const key = `active_chat:${userId}`;
    client.set(key, chatId);
  });
  //

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

  //testing

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
