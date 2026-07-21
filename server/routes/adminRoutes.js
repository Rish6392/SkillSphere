const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getAllUsers,
  suspendUser,
  verifyFreelancer,
  approveGig,
  getAllPayments,
  getAllDisputes,
  getAdminLogs,
} = require("../controllers/adminController");
const { verifyToken } = require("../middlewares/auth");
const { authorize } = require("../middlewares/roleAuth");

// All admin routes require admin role
router.use(verifyToken, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/users", getAllUsers);
router.put("/users/:id/suspend", suspendUser);
router.put("/freelancers/:id/verify", verifyFreelancer);
router.put("/gigs/:id/approve", approveGig);
router.get("/payments", getAllPayments);
router.get("/disputes", getAllDisputes);
router.get("/logs", getAdminLogs);

module.exports = router;
