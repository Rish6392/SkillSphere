const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      trim: true,
      maxlength: [3000, "Cover letter cannot exceed 3000 characters"],
    },
    bidAmount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [0, "Bid amount cannot be negative"],
    },
    estimatedDuration: {
      type: String,
      required: [true, "Estimated duration is required"],
      trim: true,
    },

    // Attachments (samples, documents)
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        publicId: { type: String },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["pending", "shortlisted", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },

    // Negotiation history
    negotiationHistory: [
      {
        proposedBy: {
          type: String,
          enum: ["client", "freelancer"],
        },
        amount: { type: Number },
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Client's response
    clientNote: {
      type: String,
      trim: true,
    },

    acceptedAt: Date,
    rejectedAt: Date,
  },
  {
    timestamps: true,
  }
);

// A freelancer can only submit one proposal per gig
proposalSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.model("Proposal", proposalSchema);
