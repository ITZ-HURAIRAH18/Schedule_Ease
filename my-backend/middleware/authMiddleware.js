// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🧩 Fetch full user from DB to attach full info
    const user = await User.findById(decoded.id || decoded._id).select("-password");

    if (!user)
      return res.status(401).json({ message: "User not found" });

    req.user = user; // ✅ now contains _id, email, role, etc.
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Role-based access
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied: Admin only" });
  next();
};

export const isHost = (req, res, next) => {
  if (req.user.role !== "host")
    return res.status(403).json({ message: "Access denied: Host only" });
  next();
};

export const isUser = (req, res, next) => {
  if (req.user.role !== "user")
    return res.status(403).json({ message: "Access denied: User only" });
  next();
};
