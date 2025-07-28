const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: ObjectId,
      ref: "user",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "video", "placeholder"],
      // enum: ["text", "image", "file", "video"],
      default: "text",
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true },
        size: Number,
        name: String,
      },
    ],
    readBy: [
      {
        type: ObjectId,
        ref: "user",
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

//indexes
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 }); // can add a feature of how much active he was
messageSchema.index({ createdAt: -1 });
module.exports = mongoose.model("Message", messageSchema);
