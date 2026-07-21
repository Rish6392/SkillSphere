const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Amounts
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    freelancerPayout: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },

    // Payment type
    paymentType: {
      type: String,
      enum: ["escrow", "milestone", "refund", "bonus"],
      required: true,
    },

    // Milestone reference (if milestone payment)
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Razorpay details
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },

    // Stripe details (alternative)
    stripePaymentIntentId: {
      type: String,
    },
    stripeChargeId: {
      type: String,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "held", "released", "refunded", "failed", "cancelled"],
      default: "pending",
    },

    // Refund details
    refundReason: String,
    refundedAt: Date,

    // Release details
    releasedAt: Date,

    // Description
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ clientId: 1, status: 1 });
paymentSchema.index({ freelancerId: 1, status: 1 });
paymentSchema.index({ gigId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
