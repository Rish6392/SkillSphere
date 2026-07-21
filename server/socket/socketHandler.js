const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const onlineUsers = new Map();

module.exports = (io) => {
  // ==========================================
  // Socket.IO Authentication Middleware
  // ==========================================
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  // ==========================================
  // Connection Handler
  // ==========================================
  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${userId} (Socket: ${socket.id})`);

    // Track online user
    onlineUsers.set(userId, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));

    // Join personal room for direct notifications
    socket.join(userId);

    // ==========================================
    // JOIN CONVERSATION ROOM
    // ==========================================
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`💬 User ${userId} joined conversation: ${conversationId}`);
    });

    // ==========================================
    // LEAVE CONVERSATION ROOM
    // ==========================================
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // ==========================================
    // SEND MESSAGE
    // ==========================================
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, receiverId, content, messageType = "text" } = data;

        // Save message to DB
        const message = await Message.create({
          conversationId,
          senderId: userId,
          receiverId,
          content,
          messageType,
        });

        // Update conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = content;
          conversation.lastMessageAt = new Date();
          const currentUnread =
            conversation.unreadCount.get(receiverId.toString()) || 0;
          conversation.unreadCount.set(
            receiverId.toString(),
            currentUnread + 1
          );
          await conversation.save();
        }

        // Populate sender info
        await message.populate("senderId", "firstName lastName avatar");

        // Emit to conversation room
        io.to(conversationId).emit("new_message", message);

        // Also emit to receiver's personal room (for notification badge)
        io.to(receiverId).emit("message_notification", {
          conversationId,
          message,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
        console.error("Socket send_message error:", error);
      }
    });

    // ==========================================
    // TYPING INDICATORS
    // ==========================================
    socket.on("typing", ({ conversationId, receiverId }) => {
      socket.to(conversationId).emit("user_typing", {
        userId,
        conversationId,
      });
    });

    socket.on("stop_typing", ({ conversationId }) => {
      socket.to(conversationId).emit("user_stop_typing", {
        userId,
        conversationId,
      });
    });

    // ==========================================
    // MESSAGE READ RECEIPT
    // ==========================================
    socket.on("message_read", async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, receiverId: userId },
          { isRead: true, readAt: new Date() }
        );

        // Reset unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.unreadCount.set(userId, 0);
          await conversation.save();
        }

        // Notify sender that messages were read
        socket.to(conversationId).emit("messages_read", {
          conversationId,
          messageIds,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error("Socket message_read error:", error);
      }
    });

    // ==========================================
    // DISCONNECT
    // ==========================================
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
};
