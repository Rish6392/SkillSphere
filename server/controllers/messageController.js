const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { uploadToCloudinary } = require("../middlewares/upload");

// ==========================================
// GET USER'S CONVERSATIONS
// ==========================================
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "firstName lastName avatar")
      .populate("gigId", "title")
      .sort({ lastMessageAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MESSAGES IN A CONVERSATION
// ==========================================
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // Verify user is participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this conversation.",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: req.params.conversationId })
        .populate("senderId", "firstName lastName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversationId: req.params.conversationId }),
    ]);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      messages: messages.reverse(), // Return in chronological order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
      error: error.message,
    });
  }
};

// ==========================================
// SEND MESSAGE (REST fallback)
// ==========================================
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, gigId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: "Receiver and content are required.",
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, receiverId],
        gigId,
      });
    }

    // Create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      receiverId,
      content,
      messageType: "text",
    });

    // Update conversation
    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    await conversation.save();

    // Populate sender info
    await message.populate("senderId", "firstName lastName avatar");

    // Emit via Socket.IO if available
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("new_message", {
        message,
        conversationId: conversation._id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent.",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send message.",
      error: error.message,
    });
  }
};

// ==========================================
// MARK MESSAGES AS READ
// ==========================================
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Mark all unread messages in this conversation as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Reset unread count
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: "Messages marked as read.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read.",
      error: error.message,
    });
  }
};
