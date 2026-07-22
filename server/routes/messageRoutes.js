const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  sendFileMessage,
  markAsRead,
} = require("../controllers/messageController");
const { verifyToken } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

router.get("/conversations", verifyToken, getConversations);
router.get("/:conversationId", verifyToken, getMessages);
router.post("/send", verifyToken, sendMessage);
router.post("/upload", verifyToken, upload.single("file"), sendFileMessage);
router.put("/:conversationId/read", verifyToken, markAsRead);

module.exports = router;
