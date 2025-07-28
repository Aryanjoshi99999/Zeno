const User = require("../models/User");
const { generateToken } = require("../utils/authUtils");
const redisClient = require("../config/redis");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const mongoose = require("mongoose");
const { client } = require("../config/redis");

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

const getUsersFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ msg: "getUsersFriends: userId error" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: "getUsersFriends: user error" });
    }

    const usersFriendsIds = user.friends || [];

    const usersFriends = await Promise.all(
      usersFriendsIds.map((id) =>
        User.findById(id).select("username email status")
      )
    );
    console.log(usersFriends);
    res.json(usersFriends);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

//testing but it is a O(N^2) solution
const getPOnlineUsersId = async (req, res) => {
  try {
    const users = await client.sMembers("online:users");
    console.log(users);
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

    // testing

    const redisKey = `messages:${chat._id.toString()}`;
    const redisLen = await client.lLen(redisKey);

    // doubt: "what if a new message came when the user was busy
    // with another person and if he selects the another user(again)
    // so is the new message will be updated in the cache"

    try {
      if (redisLen == 0) {
        await client.lPush(redisKey, JSON.stringify({ type: "placeholder" }));
        // await client.lTrim(redisKey, 0, 0); //  will the list exist with size  == 0

        console.log("redis list is empty");
      } else {
        console.log("redis list is not empty ");
      }
      return res.status(200).json({ success: true, chatId: chat._id });
    } catch (err) {
      console.error("Error is:", err);
      return res.status(500).json({
        success: false,
        message: "Redis cache error",
        error: err.message,
      });
    }

    //
    // if (recentMessages) {
    //   return res.status(200).json({ success: true, recentMessages });
    // } else {
    //   return res.status(200).json({ success: true, chatId: chat._id });
    // }
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
    console.log(chat._id);
    if (!chat) {
      return res.status(404).json({ success: false, error: "No chat found" });
    }
    const strId = chat._id.toString();
    console.log(strId);
    const key = `messages:${strId}`;

    const limit = 25;
    let messages = [];
    let flag = 0;

    const filter = { chatId: chat._id };
    if (cursorObjId) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursorObjId) };
      console.log("mildkladsf");
      console.log("BackEnd cursor objectId :" + cursorObjId);
    } else if ((await client.lLen(key)) > 1) {
      console.log(await client.lLen(key));
      const redisData = await client.lRange(
        key,
        0,
        (await client.lLen(key)) - 1
      );

      const parsedMessages = redisData
        .map((msg) => {
          try {
            return JSON.parse(msg);
          } catch (err) {
            console.error("Error parsing Redis msg:", msg);
            return null;
          }
        })
        .filter((msg) => msg && msg.type !== "placeholder");

      if (parsedMessages.length > 0) {
        messages = parsedMessages;
        flag = 1;
      }
    }
    if (flag == 0) {
      messages = await Message.find(filter)
        .populate("sender", "username _id")
        .populate("chatId")
        .sort({ _id: -1 })
        .limit(limit);
    }

    // testing
    if (flag == 0) {
      messages.forEach((msg) => {
        client.rPush(key, `${JSON.stringify(msg)}`);
      });
    }

    //

    messages.forEach((msg) => {
      console.log(msg.content);
    });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// testing : friends thing

const sendFriendRequest = async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.params.targetId;

  if (senderId == receiverId) {
    return res
      .status(400)
      .json({ message: "You can't send request to yourself" });
  }

  const sender = await User.findById(senderId);
  console.log(sender);
  const receiver = await User.findById(receiverId);

  if (!receiver) {
    return res.status(400).json({ message: "User not found" });
  }

  if (receiver.friendRequests.includes(senderId)) {
    return res.status(400).json({ message: "already send request" });
  }
  if (receiver.blockedUsers.includes(senderId)) {
    return res.status(400).json({ message: "you are blocked by the user" });
  }

  receiver.friendRequests.push(senderId);
  await receiver.save();

  res.json({ sender, receiver, success: true, message: "Friend Request sent" });
};

const acceptFriendRequest = async (req, res) => {
  const receiverId = req.user._id;
  const senderId = req.params.senderId;

  const receiver = await User.findById(receiverId);
  const sender = await User.findById(senderId);

  if (!receiver.friendRequests.includes(senderId))
    return res.status(400).json({ msg: "No request from this user" });

  receiver.friends.push(senderId);
  sender.friends.push(receiverId);

  receiver.friendRequests = receiver.friendRequests.filter(
    (id) => id.toString() !== senderId
  );

  await receiver.save();
  await sender.save();

  res.json({ sender, receiver, msg: "Friend request accepted" });
};

const blockUser = async (req, res) => {
  const userId = req.user.id;
  const targetId = req.params.targetId;

  if (userId == targetId) {
    return res.status(400).json({ msg: "you can't block yourself" });
  }

  const user = await User.findById(userId);
  const target = await User.findById(targetId);

  if (!target) return res.status(404).json({ msg: "User not found" });

  user.friends = user.friends.filter((id) => id.toString() !== targetId);
  target.friends = target.friends.filter((id) => id.toString() !== userId);

  user.friendRequests = user.friendRequests.filter(
    (id) => id.toString() !== targetId
  );
  target.friendRequests = target.friendRequests.filter(
    (id) => id.toString() !== userId
  );

  if (!user.blockedUsers.includes(targetId)) {
    user.blockedUsers.push(targetId);
  }

  await user.save();
  await target.save();

  res.json({ user, target, msg: "User blocked" });
};

const unBlockUser = async (req, res) => {
  const userId = req.user._id;
  const toUnUserId = req.params.targetId;

  if (!toUnUserId) {
    return res.status(400).json({ msg: "Unblock: User id is not provided" });
  }

  const user = await User.findById(userId);
  const toUnUser = await User.findById(toUnUserId);

  if (!toUnUser) {
    return res.status(400).json({ msg: "User don't exist" });
  }

  if (!user.blockedUsers.includes(toUnUserId)) {
    return res.status(400).json({ msg: "User already unblocked" });
  }

  user.blockedUsers = user.blockedUsers.filter(
    (id) => id.toString() !== toUnUserId
  );

  await user.save();

  return res
    .status(200)
    .json({ user, toUnUser, msg: "User successfully unblocked" });
};
//

//testing

// const listUpdate = async (req, res) => {
//   const { chatId } = req.params;
//   const { message } = req.body;
//   console.log("the chat Id for testing is :" + chatId);
//   const key = `messages:${chatId}`;
//   try {
//     client.lPush(key, JSON.stringify(message));
//     return res
//       .status(200)
//       .json({ success: true, message: "the message is pushed to the list" });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err });
//   }
// };

//
module.exports = {
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
};
