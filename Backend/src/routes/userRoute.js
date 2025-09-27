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
  getPOnlineUsersId,
  blockUser,
  unBlockUser,
  userSearch,
  getFriendRequests,
  getUsersChats,
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/profile/:userId", protect, getProfile);

// update profile cancelled due to security reasons
// userRouter.put("/profile", protect, updateProfile);
//
userRouter.get("/online-users", protect, getUsersFriends);
// testing
userRouter.get("/chats", protect, getUsersChats);
//
userRouter.get("/get-status", protect, getPOnlineUsersId);
userRouter.post("/access-chat-or-create", protect, accessChat);
userRouter.get("/getMessages", protect, getMessages);

userRouter.get("/find-user/", protect, userSearch);

userRouter.post(
  "/profile/friend-request/:targetId",
  protect,
  sendFriendRequest
);

// add the getfriendRequest route
// testing
userRouter.get("/get-friend-requests", protect, getFriendRequests);

//
userRouter.post("/accept-request/:senderId", protect, acceptFriendRequest);
userRouter.post("/block/:targetId", protect, blockUser);
userRouter.post("/un-block/:targetId", protect, unBlockUser);

module.exports = userRouter;
