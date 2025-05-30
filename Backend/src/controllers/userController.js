const User = require("../models/User");
const { generateToken } = require("../utils/authUtils");
const redisClient = require("../config/redis");

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
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getOnlineUsers,
};
