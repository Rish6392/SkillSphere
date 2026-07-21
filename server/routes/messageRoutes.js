const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} = require("../controllers/messageController");
const { verifyToken } = require("../middlewares/auth");

router.get("/conversations", verifyToken, getConversations);
router.get("/:conversationId", verifyToken, getMessages);
router.post("/send", verifyToken, sendMessage);
router.put("/:conversationId/read", verifyToken, markAsRead);

module.exports = router;
