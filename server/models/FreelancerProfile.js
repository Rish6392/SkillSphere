const mongoose = require("mongoose");

const freelancerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [120, "Headline cannot exceed 120 characters"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, "Bio cannot exceed 2000 characters"],
    },

    // Skills with proficiency level
    skills: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        proficiency: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "intermediate",
        },
      },
    ],

    // Portfolio gallery
    portfolio: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        image: { type: String }, // Cloudinary URL
        link: { type: String, trim: true },
        tags: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Resume upload
    resume: {
      url: { type: String }, // Cloudinary URL
      publicId: { type: String },
      uploadedAt: { type: Date },
    },

    // Certifications
    certifications: [
      {
        name: { type: String, required: true, trim: true },
        issuer: { type: String, trim: true },
        year: { type: Number },
        certificateUrl: { type: String },
      },
    ],

    // Work experience timeline
    workExperience: [
      {
        title: { type: String, required: true, trim: true },
        company: { type: String, trim: true },
        from: { type: Date },
        to: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String, trim: true },
      },
    ],

    // Availability calendar
    availability: {
      status: {
        type: String,
        enum: ["available", "partially_available", "unavailable"],
        default: "available",
      },
      slots: [
        {
          day: {
            type: String,
            enum: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          startTime: { type: String }, // "09:00"
          endTime: { type: String },   // "17:00"
        },
      ],
    },

    // Pricing
    pricing: {
      hourlyRate: {
        type: Number,
        min: [0, "Hourly rate cannot be negative"],
      },
      minimumBudget: {
        type: Number,
        min: [0, "Minimum budget cannot be negative"],
      },
    },

    // Verification & Badges
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
    },
    badges: [
      {
        type: {
          type: String,
          enum: [
            "top_rated",
            "rising_talent",
            "verified",
            "expert",
            "quick_responder",
          ],
        },
        earnedAt: { type: Date, default: Date.now },
      },
    ],

    // Stats
    reputationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    profileViews: {
      type: Number,
      default: 0,
    },

    // Categories the freelancer works in
    categories: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

// Text index for search
freelancerProfileSchema.index({
  headline: "text",
  bio: "text",
  "skills.name": "text",
  categories: "text",
});

module.exports = mongoose.model("FreelancerProfile", freelancerProfileSchema);
