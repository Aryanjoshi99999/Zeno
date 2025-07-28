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
const { channel } = require("diagnostics_channel");

//App config
const app = express();
const port = process.env.PORT;

//database connection
connectDB();

app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json());

//
client

  .set("hello", "world")
  .then(() => client.get("hello"))
  .then((val) => console.log("Test redis value", val))
  .catch(console.error);

// socket.io setup

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log("No token provided");
    return next(new Error("Authentication token required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// map (userId -> socketId)

const userSocketMap = new Map();

io.on("connection", async (socket) => {
  const userId = socket.userId;
  userSocketMap.set(userId, socket.id);
  const user = await User.findById(userId).select("username");

  const userName = user.username;
  //testing

  const res = await client.sAdd("online:users", ` ${userId}`);
  console.log("the user is pushed to online user list" + res);
  //
  await client.set(`onlineUsersId:${userId}`, "true"); // added for tracking the real online user
  await client.set(`online:${userName}`, "true");
  await User.findByIdAndUpdate({ _id: userId }, { status: "online" });

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  io.emit("user-online", { userName });

  socket.on("logout", async () => {
    //testing
    const res = await client.sRem("online:users", `${userName} : ${userId}`);
    console.log("the user is removed from online user list" + res);
    //

    await client.del(`online:${userName}`);
    await client.del(`onlineUsersId:${userId}`);
    userSocketMap.delete(userId);
    //testing

    // removing this line
    //const result = await client.flushAll(); // This flushes all keys in Redis
    //console.log("Redis FLUSHALL result:", result);
    //

    // await client.quit();

    await User.findOneAndUpdate(
      { _id: userId },
      {
        status: "offline",
      }
    );
    io.emit("user-offline", { userName });
  });

  // socket.on("disconnect", async () => {
  //   await client.del(`online:${userName}`);
  //   // await User.findOneAndUpdate(
  //   //   { _id: userId },
  //   //   {
  //   //     status: "offline",
  //   //   }
  //   // );
  //   io.emit("user-offline", { userName });
  // });

  // socket.on("send_message", async ({ chatId, content, type }) => {
  //   const senderId = socket.userId;

  //   const chat = await Chat.findById(chatId).populate(
  //     "participants",
  //     "_id username"
  //   );
  //   // console.log(chat);
  //   if (!chat) return;

  //   const message = await Message.create({
  //     chatId,
  //     sender: senderId,
  //     content,
  //     type,
  //   });

  //   // console.log(message);

  //   //sending the message
  //   const fullMessage = await message.populate("sender", "username _id");

  //   chat.participants.forEach((user) => {
  //     const recieverSocketId = userSocketMap.get(user._id.toString());
  //     if (recieverSocketId) {
  //       console.log("📤 Emitting message to:", recieverSocketId);
  //       console.log("📤 Message:", message);
  //       io.to(recieverSocketId).emit("new_message", fullMessage);
  //     }
  //   });
  // });

  socket.on("send_message", async ({ chatId, content, type }) => {
    console.log("Message received on server:", { chatId, content });
    const senderId = socket.userId;

    const chat = await Chat.findById(chatId).populate(
      "participants",
      "_id username"
    );
    // console.log(chat);
    if (!chat) return;

    const message = await Message.create({
      chatId,
      sender: senderId,
      content,
      type,
    });

    // console.log(message);

    //sending the message

    const fullMessage = await message.populate("sender", "username _id");

    // Publishing to the channel with name chat:{chatId}
    console.log("publishing the message");
    await pubClient.publish(`chat:${chatId}`, JSON.stringify(fullMessage));
  });
});

subClient.pSubscribe("chat:*", async (message, channel) => {
  //console.log(message);
  console.log("subscribe: message is received");
  console.log(channel);
  const chatId = channel.split(":")[1];
  console.log("subscribe: the chat id is" + chatId);
  const parsedMessage = JSON.parse(message);

  //testing
  try {
    const key = `messages:${chatId}`;

    const res = await client.lPush(key, JSON.stringify(parsedMessage));
    console.log("the responst in the multiple message bug fix is" + res);
  } catch (err) {
    console.log(err);
  }

  //
  io.to(chatId).emit("new_message", parsedMessage);
  console.log("subscribe: Message is sent to room");
});

// API endpoints

app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

server.listen(port, () => {
  console.log(`server is started on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await pubClient.quit();
  await subClient.quit();
  await client.quit();

  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});
