const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },

    // Rating breakdown
    rating: {
      type: Number,
      required: [true, "Overall rating is required"],
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Review text
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: true, // Auto-verified if linked to completed gig
    },

    // Flag system for fake reviews
    flagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Reviewee can respond
    response: {
      text: { type: String, trim: true },
      respondedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// One review per reviewer per gig
reviewSchema.index({ reviewerId: 1, gigId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
