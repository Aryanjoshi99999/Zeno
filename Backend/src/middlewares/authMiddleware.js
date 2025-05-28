const { verifyToken } = require("../utils/authUtils");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);

      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };
