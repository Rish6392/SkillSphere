const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// Verify JWT Token Middleware
// ==========================================
const verifyToken = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer") &&
        req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Token may be invalid.",
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Contact support.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

// ==========================================
// Optional Auth (doesn't block if no token)
// ==========================================
const optionalAuth = async (req, res, next) => {
  try {
    let token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer") &&
        req.headers.authorization.split(" ")[1]);

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isSuspended && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently continue without user
  }
  next();
};

module.exports = { verifyToken, optionalAuth };
