const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
  deleteAccount,
} = require("../controllers/userController");
const { verifyToken } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

// Protected routes
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);
router.delete("/account", verifyToken, deleteAccount);

// Public routes
router.get("/:id", getPublicProfile);

module.exports = router;
