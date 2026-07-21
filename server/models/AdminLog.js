const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "user_suspended",
        "user_activated",
        "user_deleted",
        "freelancer_verified",
        "freelancer_rejected",
        "gig_approved",
        "gig_rejected",
        "gig_removed",
        "payment_refunded",
        "payment_released",
        "dispute_resolved",
        "dispute_escalated",
        "review_removed",
        "settings_updated",
        "admin_login",
      ],
    },
    targetType: {
      type: String,
      enum: ["User", "Gig", "Payment", "Dispute", "Review", "Settings"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      trim: true,
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed, // Store previous state for audit
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying admin activity
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);
