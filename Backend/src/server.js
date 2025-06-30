const express = require("express");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { redisClient, pubClient, subClient } = require("./config/redis");
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
redisClient

  .set("hello", "world")
  .then(() => redisClient.get("hello"))
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
  // console.log("testing");
  const token = socket.handshake.auth.token;
  // console.log("Connection attempt with token:", token); // Debug log

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
  await redisClient.set(`onlineUsersId:${userId}`, "true"); // added for tracking the real online user
  await redisClient.set(`online:${userName}`, "true");
  await User.findByIdAndUpdate({ _id: userId }, { status: "online" });

  io.emit("user-online", { userName });

  socket.on("logout", async () => {
    await redisClient.del(`online:${userName}`);
    await redisClient.del(`onlineUsersId:${userId}`);
    userSocketMap.delete(userId);
    await User.findOneAndUpdate(
      { _id: userId },
      {
        status: "offline",
      }
    );
    io.emit("user-offline", { userName });
  });

  // socket.on("disconnect", async () => {
  //   await redisClient.del(`online:${userName}`);
  //   // await User.findOneAndUpdate(
  //   //   { _id: userId },
  //   //   {
  //   //     status: "offline",
  //   //   }
  //   // );
  //   io.emit("user-offline", { userName });
  // });

  socket.on("send_message", async ({ chatId, content, type }) => {
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

    chat.participants.forEach((user) => {
      const recieverSocketId = userSocketMap.get(user._id.toString());
      if (recieverSocketId) {
        console.log("📤 Emitting message to:", recieverSocketId);
        console.log("📤 Message:", message);
        io.to(recieverSocketId).emit("new_message", fullMessage);
      }
    });
  });

//   socket.on("send_message", async ({ chatId, content, type }) => {
//     const senderId = socket.userId;

//     const chat = await Chat.findById(chatId).populate(
//       "participants",
//       "_id username"
//     );
//     // console.log(chat);
//     if (!chat) return;

//     const message = await Message.create({
//       chatId,
//       sender: senderId,
//       content,
//       type,
//     });

//     // console.log(message);

//     //sending the message
//     const fullMessage = await message.populate("sender", "username _id");

//     // Publishing to the channel with name chat:{chatId}
//     await pubClient.publish(`chat:{chatId}`, JSON.stringify(fullMessage));
//   });
// });

subClient.pSubscribe("chat:*", (channel, message) => {
  console.log(message);
  console.log(channel);
  const chatId = channel.split(":")[1];
  const parsedMessage = JSON.parse(message);

  io.to(chatId).emit("new_message", parsedMessage);
});

// API endpoints

app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

server.listen(port, () => {
  console.log(`server is started on http://localhost:${port}`);
});
