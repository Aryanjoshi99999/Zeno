const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getOnlineUsers,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/profile", protect, getProfile);
userRouter.put("/profile", protect, updateProfile);
userRouter.get("/online-users", protect, getOnlineUsers);

module.exports = userRouter;
