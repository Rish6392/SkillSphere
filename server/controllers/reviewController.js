const Review = require("../models/Review");
const Gig = require("../models/Gig");
const FreelancerProfile = require("../models/FreelancerProfile");
const Notification = require("../models/Notification");

// ==========================================
// Reputation Calculator Utility
// ==========================================
const calculateReputation = (reviews) => {
  if (reviews.length === 0) return 0;

  let totalWeighted = 0;
  reviews.forEach((review) => {
    const quality = review.quality || review.rating;
    const communication = review.communication || review.rating;
    const timeliness = review.timeliness || review.rating;

    // Weighted score: quality 40%, communication 30%, timeliness 30%
    const weighted = quality * 0.4 + communication * 0.3 + timeliness * 0.3;
    totalWeighted += weighted;
  });

  return Math.round((totalWeighted / reviews.length) * 100) / 100;
};

// ==========================================
// SUBMIT REVIEW
// ==========================================
exports.submitReview = async (req, res) => {
  try {
    const { revieweeId, gigId, rating, communication, quality, timeliness, comment } =
      req.body;

    if (!revieweeId || !gigId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "revieweeId, gigId, rating, and comment are required.",
      });
    }

    // Verify gig is completed
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }
    if (gig.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be submitted for completed gigs.",
      });
    }

    // Verify reviewer is part of this gig
    const isClient = gig.clientId.toString() === req.user._id.toString();
    const isFreelancer =
      gig.assignedFreelancer?.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: "Only gig participants can submit reviews.",
      });
    }

    // Can't review yourself
    if (revieweeId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot review yourself.",
      });
    }

    // Check for duplicate review
    const existingReview = await Review.findOne({
      reviewerId: req.user._id,
      gigId,
    });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You've already reviewed for this gig.",
      });
    }

    const review = await Review.create({
      reviewerId: req.user._id,
      revieweeId,
      gigId,
      rating,
      communication: communication || rating,
      quality: quality || rating,
      timeliness: timeliness || rating,
      comment,
      isVerified: true,
    });

    // Update freelancer reputation score
    const allReviews = await Review.find({ revieweeId });
    const newReputation = calculateReputation(allReviews);

    await FreelancerProfile.findOneAndUpdate(
      { userId: revieweeId },
      {
        reputationScore: newReputation,
        totalReviews: allReviews.length,
      }
    );

    // Notify the reviewee
    await Notification.create({
      userId: revieweeId,
      type: "review_added",
      title: "New Review Received ⭐",
      message: `You received a ${rating}-star review for "${gig.title}".`,
      link: `/reviews/${review._id}`,
      relatedId: review._id,
      relatedModel: "Review",
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit review.",
      error: error.message,
    });
  }
};

// ==========================================
// GET REVIEWS FOR A USER
// ==========================================
exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ revieweeId: req.params.userId, flagged: false })
        .populate("reviewerId", "firstName lastName avatar")
        .populate("gigId", "title category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ revieweeId: req.params.userId, flagged: false }),
    ]);

    // Calculate average ratings
    const allReviews = await Review.find({
      revieweeId: req.params.userId,
      flagged: false,
    });

    const avgRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      averageRating: Math.round(avgRating * 10) / 10,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews.",
      error: error.message,
    });
  }
};

// ==========================================
// RESPOND TO REVIEW
// ==========================================
exports.respondToReview = async (req, res) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (review.revieweeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the reviewee can respond.",
      });
    }

    review.response = {
      text,
      respondedAt: new Date(),
    };
    await review.save();

    res.status(200).json({
      success: true,
      message: "Response added.",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to respond to review.",
      error: error.message,
    });
  }
};

// ==========================================
// FLAG REVIEW
// ==========================================
exports.flagReview = async (req, res) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    review.flagged = true;
    review.flagReason = reason;
    review.flaggedBy = req.user._id;
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review flagged for admin review.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to flag review.",
      error: error.message,
    });
  }
};
