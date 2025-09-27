import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      console.log("❌ No token provided");
      return res.status(403).json({ message: "Access Denied - No token provided" });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }

    console.log("🔑 Verifying token...");
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified for user:", verified.id);
    req.user = verified;

    // Check if user is banned
    const user = await User.findById(verified.id);
    if (user && user.isBanned) {
      console.log("🚫 User is banned, forcing logout:", user.email);
      return res.status(403).json({
        message: "Your account has been banned",
        error: "USER_BANNED",
        bannedAt: user.bannedAt,
        bannedBy: user.bannedBy,
        logout: true, // Client should handle logout
        details: user.banReason || "Violation of community guidelines"
      });
    }

    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log("❌ User not found for admin verification");
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.isAdmin) {
      console.log("❌ Access denied - User is not admin:", user.email);
      return res.status(403).json({ message: "Access Denied - Admin privileges required" });
    }
    
    console.log("✅ Admin access verified for:", user.email);
    next();
  } catch (err) {
    console.error("❌ Admin verification failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};
