const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getUsersFriends,
  accessChat,
  getMessages,
  sendFriendRequest,
  acceptFriendRequest,
  blockUser,
  unBlockUser,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/profile", protect, getProfile);
userRouter.put("/profile", protect, updateProfile);
userRouter.get("/online-users", protect, getUsersFriends);
userRouter.post("/access-chat-or-create", protect, accessChat);
userRouter.get("/getMessages", protect, getMessages);

//testing
// userRouter.post("/list-updator/:chatId", protect, listUpdate);
//

userRouter.post("/friend-request/:targetId", protect, sendFriendRequest);
userRouter.post("/accept-request/:senderId", protect, acceptFriendRequest);
userRouter.post("/block/:targetId", protect, blockUser);
userRouter.post("/un-block/:targetId", protect, unBlockUser);

module.exports = userRouter;
