const express = require("express");
const router = express.Router();
const {
  submitReview,
  getUserReviews,
  respondToReview,
  flagReview,
} = require("../controllers/reviewController");
const { verifyToken } = require("../middlewares/auth");

router.post("/", verifyToken, submitReview);
router.get("/user/:userId", getUserReviews);
router.put("/:id/respond", verifyToken, respondToReview);
router.post("/:id/flag", verifyToken, flagReview);

module.exports = router;
