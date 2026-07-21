const express = require("express");
const router = express.Router();
const {
  submitProposal,
  getGigProposals,
  getProposalById,
  acceptProposal,
  rejectProposal,
  negotiateProposal,
  withdrawProposal,
  getMyProposals,
} = require("../controllers/proposalController");
const { verifyToken } = require("../middlewares/auth");
const { authorize } = require("../middlewares/roleAuth");

// Freelancer routes
router.post("/", verifyToken, authorize("freelancer"), submitProposal);
router.get("/my-proposals", verifyToken, authorize("freelancer"), getMyProposals);
router.put("/:id/withdraw", verifyToken, authorize("freelancer"), withdrawProposal);

// Client routes
router.get("/gig/:gigId", verifyToken, authorize("client"), getGigProposals);
router.put("/:id/accept", verifyToken, authorize("client"), acceptProposal);
router.put("/:id/reject", verifyToken, authorize("client"), rejectProposal);
router.put("/:id/negotiate", verifyToken, authorize("client"), negotiateProposal);

// Shared
router.get("/:id", verifyToken, getProposalById);

module.exports = router;
