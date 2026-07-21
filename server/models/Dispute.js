const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "payment_issue",
        "quality_issue",
        "deadline_missed",
        "communication_issue",
        "scope_creep",
        "fraud",
        "other",
      ],
      required: [true, "Dispute reason is required"],
    },
    description: {
      type: String,
      required: [true, "Dispute description is required"],
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    // Evidence uploads
    evidence: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        publicId: { type: String },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Status tracking
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed", "escalated"],
      default: "open",
    },

    // Admin handling
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminNotes: [
      {
        note: { type: String },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Resolution
    resolution: {
      type: String,
      enum: [
        "refund_full",
        "refund_partial",
        "payment_released",
        "warning_issued",
        "account_suspended",
        "no_action",
      ],
    },
    resolutionDetails: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Related payment (if payment dispute)
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
disputeSchema.index({ raisedBy: 1, status: 1 });
disputeSchema.index({ against: 1, status: 1 });
disputeSchema.index({ gigId: 1 });

module.exports = mongoose.model("Dispute", disputeSchema);
