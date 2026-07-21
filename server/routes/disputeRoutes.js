const express = require("express");
const router = express.Router();
const {
  raiseDispute,
  getDispute,
  uploadEvidence,
  resolveDispute,
  getMyDisputes,
} = require("../controllers/disputeController");
const { verifyToken } = require("../middlewares/auth");
const { authorize } = require("../middlewares/roleAuth");
const { upload } = require("../middlewares/upload");

router.post("/", verifyToken, raiseDispute);
router.get("/my-disputes", verifyToken, getMyDisputes);
router.get("/:id", verifyToken, getDispute);
router.post(
  "/:id/evidence",
  verifyToken,
  upload.array("files", 5),
  uploadEvidence
);
router.put("/:id/resolve", verifyToken, authorize("admin"), resolveDispute);

module.exports = router;
