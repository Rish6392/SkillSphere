/**
 * Reputation Calculator
 * 
 * Calculates a weighted reputation score based on multi-dimensional reviews.
 * Used after every new review to update the freelancer's overall reputation.
 */

/**
 * Calculate weighted reputation score
 * @param {Array} reviews - Array of review documents
 * @returns {number} Reputation score between 0 and 5
 */
const calculateReputationScore = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;

  // Filter only verified, non-flagged reviews
  const validReviews = reviews.filter((r) => r.isVerified && !r.flagged);
  if (validReviews.length === 0) return 0;

  let totalWeighted = 0;

  validReviews.forEach((review) => {
    const quality = review.quality || review.rating;
    const communication = review.communication || review.rating;
    const timeliness = review.timeliness || review.rating;

    // Weighted breakdown: Quality 40%, Communication 30%, Timeliness 30%
    const reviewScore =
      quality * 0.4 + communication * 0.3 + timeliness * 0.3;

    totalWeighted += reviewScore;
  });

  const avgScore = totalWeighted / validReviews.length;

  // Apply recency bias — recent reviews have slightly more weight
  // This is a simplified version; a more advanced one would use decay functions
  const recentReviews = validReviews
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recentReviews.length >= 3) {
    let recentTotal = 0;
    recentReviews.forEach((review) => {
      const quality = review.quality || review.rating;
      const communication = review.communication || review.rating;
      const timeliness = review.timeliness || review.rating;
      recentTotal += quality * 0.4 + communication * 0.3 + timeliness * 0.3;
    });
    const recentAvg = recentTotal / recentReviews.length;

    // 70% overall + 30% recent trend
    const finalScore = avgScore * 0.7 + recentAvg * 0.3;
    return Math.round(finalScore * 100) / 100;
  }

  return Math.round(avgScore * 100) / 100;
};

/**
 * Detect potentially fake reviews
 * @param {Object} review - Review document
 * @param {Array} existingReviews - All reviews for the reviewee
 * @returns {Object} { isSuspicious, reasons }
 */
const detectFakeReview = (review, existingReviews) => {
  const reasons = [];

  // Check if reviewer has reviewed too many times in a short period
  const recentReviews = existingReviews.filter(
    (r) =>
      r.reviewerId?.toString() === review.reviewerId?.toString() &&
      Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000
  );

  if (recentReviews.length > 2) {
    reasons.push("Multiple reviews from same reviewer in 24 hours");
  }

  // Check for extreme rating that deviates from average
  if (existingReviews.length >= 5) {
    const avgRating =
      existingReviews.reduce((sum, r) => sum + r.rating, 0) /
      existingReviews.length;

    if (Math.abs(review.rating - avgRating) > 2.5) {
      reasons.push("Rating significantly deviates from average");
    }
  }

  // Check for very short comments
  if (review.comment && review.comment.length < 10) {
    reasons.push("Suspiciously short review comment");
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
};

module.exports = {
  calculateReputationScore,
  detectFakeReview,
};
