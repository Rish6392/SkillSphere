const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  releaseMilestonePayment,
  refundPayment,
  getPaymentHistory,
  getEarnings,
} = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/auth");
const { authorize } = require("../middlewares/roleAuth");

router.post("/create-order", verifyToken, authorize("client"), createOrder);
router.post("/verify", verifyToken, authorize("client"), verifyPayment);
router.put("/milestone/:id/release", verifyToken, authorize("client"), releaseMilestonePayment);
router.post("/refund/:id", verifyToken, authorize("admin"), refundPayment);
router.get("/history", verifyToken, getPaymentHistory);
router.get("/earnings", verifyToken, authorize("freelancer"), getEarnings);

module.exports = router;
