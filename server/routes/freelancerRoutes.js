const express = require("express");
const router = express.Router();
const {
  updateFreelancerProfile,
  getMyProfile,
  getFreelancerById,
  addPortfolioItem,
  deletePortfolioItem,
  uploadResume,
  addCertification,
  updateAvailability,
  getTopFreelancers,
} = require("../controllers/freelancerController");
const { verifyToken } = require("../middlewares/auth");
const { authorize } = require("../middlewares/roleAuth");
const { upload } = require("../middlewares/upload");

// Public routes
router.get("/top", getTopFreelancers);
router.get("/:id", getFreelancerById);

// Protected — Freelancer only
router.get("/me/profile", verifyToken, authorize("freelancer"), getMyProfile);
router.put("/profile", verifyToken, authorize("freelancer"), updateFreelancerProfile);
router.post(
  "/portfolio",
  verifyToken,
  authorize("freelancer"),
  upload.single("image"),
  addPortfolioItem
);
router.delete(
  "/portfolio/:itemId",
  verifyToken,
  authorize("freelancer"),
  deletePortfolioItem
);
router.put(
  "/resume",
  verifyToken,
  authorize("freelancer"),
  upload.single("resume"),
  uploadResume
);
router.post(
  "/certifications",
  verifyToken,
  authorize("freelancer"),
  addCertification
);
router.put(
  "/availability",
  verifyToken,
  authorize("freelancer"),
  updateAvailability
);

module.exports = router;
