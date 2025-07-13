const User = require("../models/User");
const { generateToken } = require("../utils/authUtils");
const redisClient = require("../config/redis");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const mongoose = require("mongoose");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Authentication failed - token generation error",
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const token = generateToken(user._id);

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        message: "succesfully logged in ",
        data: {
          token,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "user information",
      data: { user: req.user },
    });
  } catch (error) {
    console.error("profile fetch error", error);
    res.status(500).json({
      success: false,
      message: "server error while fetching user information",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.displayName = req.body.displayName || user.displayName;
    user.profilePicture = req.body.profilePicture || user.profilePicture;
    user.status = req.body.status || user.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User info updated successfully",
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while updating profile" });
  }
};

const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find().select("username email status");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }

  // console.log(data);
  // const keys = await redisClient.keys("online:*");
  // const userName = keys.map((key) => key.split(":")[1]);
  // res.json(userName);
};

const accessChat = async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user._id;

  if (!recipientId) {
    return res
      .status(400)
      .json({ success: false, error: "recipientId is required" });
  }

  try {
    let chat = await Chat.findOne({
      type: "private",
      participants: { $all: [senderId, recipientId], $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({
        type: "private",
        participants: [senderId, recipientId],
      });
    }

    res.status(200).json({ success: true, chatId: chat._id });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// const getMessages = async (req, res) => {
//   const { recipientId } = req.query;
//   const senderId = req.user._id;

//   if (!recipientId) {
//     return res
//       .status(400)
//       .json({ success: false, error: "recipientId is required" });
//   }

//   try {
//     let chat = await Chat.findOne({
//       type: "private",
//       participants: {
//         $all: [senderId, recipientId],
//         $size: 2,
//       },
//     });

//     if (!chat || chat.length === 0) {
//       return res.status(404).json({ success: false, error: "No chat found" });
//     }

//     const messages = await Message.find({ chatId: chat._id })
//       .populate("sender", "username _id")
//       .populate("chatId");

//     res.status(200).json({ success: true, messages });
//   } catch (err) {
//     console.error("Error fetching messages:", err.message);
//     res.status(500).json({ success: false, error: "Server error" });
//   }
// };
const getMessages = async (req, res) => {
  const { recipientId, cursorObjId } = req.query;
  const senderId = req.user._id;
  console.log(cursorObjId);

  if (!recipientId) {
    return res
      .status(400)
      .json({ success: false, error: "recipientId is required" });
  }

  try {
    let chat = await Chat.findOne({
      type: "private",
      participants: {
        $all: [senderId, recipientId],
        $size: 2,
      },
    });

    if (!chat || chat.length === 0) {
      return res.status(404).json({ success: false, error: "No chat found" });
    }

    const limit = 25;

    const filter = { chatId: chat._id };
    if (cursorObjId) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursorObjId) };
    }

    const messages = await Message.find(filter)
      .populate("sender", "username _id")
      .populate("chatId")
      .sort({ _id: -1 })
      .limit(limit);

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getOnlineUsers,
  accessChat,
  getMessages,
};
