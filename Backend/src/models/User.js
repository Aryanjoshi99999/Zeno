const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: { type: String, required: true },
    displayName: { type: String },
    profilePicture: String,
    status: { type: String, enum: ["offline", "online"], default: "offline" },
    lastSeen: Date,
    friends: [{ type: ObjectId, ref: "user" }],

    // testing:
    friendRequests: [{ type: ObjectId, ref: "user" }],
    //
    blockedUsers: [{ type: ObjectId, ref: "user" }],
  },
  { timestamps: true }
);
// method for checking the password when log in use case is :
// // loginController.js
// const user = await User.findOne({ email: req.body.email });

// if (user && (await user.matchPassword(req.body.password))) {
//   // Password is correct → generate token, send response
// } else {
//   // Invalid password → throw error
// }
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
