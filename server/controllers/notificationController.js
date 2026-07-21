const Notification = require("../models/Notification");
const mailSender = require("../utils/mailSender");

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { userId: req.user._id };
    if (unreadOnly === "true") query.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
};

// ==========================================
// HELPER: Create notification + optional email + socket
// ==========================================
exports.createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
  relatedId,
  relatedModel,
  sendEmail = false,
  emailSubject,
  emailHtml,
  io,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      relatedId,
      relatedModel,
    });

    // Emit via Socket.IO
    if (io) {
      io.to(userId.toString()).emit("notification", notification);
    }

    // Send email for critical notifications
    if (sendEmail && emailSubject && emailHtml) {
      try {
        const User = require("../models/User");
        const user = await User.findById(userId);
        if (user?.email) {
          await mailSender(user.email, emailSubject, emailHtml);
          notification.emailSent = true;
          await notification.save();
        }
      } catch (emailError) {
        console.error("Notification email failed:", emailError.message);
      }
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
};
