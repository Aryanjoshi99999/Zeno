const express = require("express");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const redisClient = require("./config/redis");
const userRouter = require("./routes/userRoute");
require("dotenv").config();

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
  const token = socket.handshake.auth.token;
  // console.log("Connection attempt with token:", token); // Debug log

  if (!token) {
    console.log("No token provided");
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

  await redisClient.set(`online:${userId}`, "true");

  socket.broadcast.emit("user-online", { userId });

  socket.on("disconnect", async () => {
    await redisClient.del(`online:${userId}`);
    socket.broadcast.emit("user-offline", { userId });
  });
});

// API endpoints

app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

server.listen(port, () => {
  console.log(`server is started on http://localhost:${port}`);
});
