const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
    },
    participants: [
      {
        type: ObjectId,
        ref: "User",
        required: true,
      },
    ],
    name: {
      type: String,
      required: function () {
        return this.type === "group";
      },
    },
    description: {
      type: String,
    },
    createdBy: {
      type: ObjectId,
      ref: "User",
    },
    admins: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);
// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, lastMessage: -1 });

module.exports = mongoose.model("Chat", chatSchema);
