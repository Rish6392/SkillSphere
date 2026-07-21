const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "gig_posted",
        "gig_updated",
        "gig_cancelled",
        "proposal_received",
        "proposal_accepted",
        "proposal_rejected",
        "proposal_shortlisted",
        "payment_received",
        "payment_released",
        "payment_refunded",
        "review_added",
        "review_response",
        "message_received",
        "dispute_opened",
        "dispute_resolved",
        "account_verified",
        "account_suspended",
        "milestone_completed",
        "deadline_reminder",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    link: {
      type: String, // URL to navigate to when clicked
      trim: true,
    },

    // Reference to related entity
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedModel: {
      type: String,
      enum: ["Gig", "Proposal", "Payment", "Review", "Dispute", "Message"],
    },

    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,

    // Email notification sent?
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching user notifications
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
