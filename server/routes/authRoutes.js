const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  changePassword,
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/auth");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/google", googleAuth);

// Protected routes
router.post("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
