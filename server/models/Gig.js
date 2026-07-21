const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Gig title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Gig description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },

    // Required skills
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // Budget
    budgetType: {
      type: String,
      enum: ["fixed", "hourly"],
      required: [true, "Budget type is required"],
    },
    budgetRange: {
      min: {
        type: Number,
        required: [true, "Minimum budget is required"],
        min: [0, "Budget cannot be negative"],
      },
      max: {
        type: Number,
        required: [true, "Maximum budget is required"],
      },
    },

    // Milestones
    milestones: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        amount: { type: Number, required: true, min: 0 },
        deadline: { type: Date },
        status: {
          type: String,
          enum: ["pending", "in_progress", "submitted", "approved", "paid"],
          default: "pending",
        },
        completedAt: Date,
      },
    ],

    // File attachments
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },   // Cloudinary URL
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Location
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    isRemote: {
      type: Boolean,
      default: true,
    },

    // Timeline
    deadline: {
      type: Date,
    },
    estimatedDuration: {
      type: String, // "1 week", "2 months", etc.
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "completed", "cancelled", "closed"],
      default: "open",
    },

    // Assigned freelancer (after accepting proposal)
    assignedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Tracking
    proposalCount: {
      type: Number,
      default: 0,
    },
    isApprovedByAdmin: {
      type: Boolean,
      default: false,
    },

    // Visibility
    visibility: {
      type: String,
      enum: ["public", "invite_only"],
      default: "public",
    },
    invitedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Text index for search
gigSchema.index({
  title: "text",
  description: "text",
  skills: "text",
  category: "text",
});

// Geolocation index
gigSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Gig", gigSchema);
