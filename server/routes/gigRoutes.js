const express = require("express");
const router = express.Router();
const {
  createGig,
  getAllGigs,
  getGigById,
  updateGig,
  changeGigStatus,
  getMyGigs,
  uploadAttachments,
  inviteFreelancer,
} = require("../controllers/gigController");
const { verifyToken } = require("../middlewares/auth");
const { authorize } = require("../middlewares/roleAuth");
const { upload } = require("../middlewares/upload");

// Public routes
router.get("/", getAllGigs);
router.get("/:id", getGigById);

// Protected — Client only
router.post("/", verifyToken, authorize("client"), createGig);
router.get("/client/my-gigs", verifyToken, authorize("client"), getMyGigs);
router.put("/:id", verifyToken, authorize("client"), updateGig);
router.put("/:id/status", verifyToken, authorize("client"), changeGigStatus);
router.post(
  "/:id/attachments",
  verifyToken,
  authorize("client"),
  upload.array("files", 5),
  uploadAttachments
);
router.post("/:id/invite", verifyToken, authorize("client"), inviteFreelancer);

module.exports = router;
