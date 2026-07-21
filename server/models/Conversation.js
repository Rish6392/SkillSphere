const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Track unread count per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    // Optional: link to a gig for context
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding conversations by participant
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
