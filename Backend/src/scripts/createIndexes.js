const mongoose = require("mongoose");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

const createIndexes = async () => {
  try {
    console.log("Starting index creation...");

    await User.init();
    console.log("user indexes verified");

    await Chat.init();
    console.log("Chat indexes verified");

    await Message.init();
    console.log("Message indexes verified");

    console.log("All indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// direct system
if (require.main === module) {
  require("dotenv").config();
  const connectDB = require("../config/db");

  (async () => {
    await connectDB();
    await createIndexes();
  })();
}

module.exports = createIndexes;
