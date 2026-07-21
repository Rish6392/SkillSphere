const User = require("../models/User");
const Gig = require("../models/Gig");
const Payment = require("../models/Payment");
const Dispute = require("../models/Dispute");
const Review = require("../models/Review");
const FreelancerProfile = require("../models/FreelancerProfile");
const AdminLog = require("../models/AdminLog");
const Notification = require("../models/Notification");

// ==========================================
// ADMIN DASHBOARD ANALYTICS
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFreelancers,
      totalClients,
      totalGigs,
      activeGigs,
      completedGigs,
      totalPayments,
      openDisputes,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: "freelancer", isActive: true }),
      User.countDocuments({ role: "client", isActive: true }),
      Gig.countDocuments(),
      Gig.countDocuments({ status: "in_progress" }),
      Gig.countDocuments({ status: "completed" }),
      Payment.aggregate([
        { $match: { status: { $in: ["held", "released"] } } },
        { $group: { _id: null, total: { $sum: "$amount" }, platformFees: { $sum: "$platformFee" } } },
      ]),
      Dispute.countDocuments({ status: { $in: ["open", "under_review"] } }),
    ]);

    const revenue = totalPayments[0] || { total: 0, platformFees: 0 };

    // Top categories
    const topCategories = await Gig.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Job success rate
    const totalProposals = await Gig.countDocuments({
      status: { $in: ["completed", "cancelled"] },
    });
    const successRate =
      totalProposals > 0
        ? Math.round((completedGigs / totalProposals) * 100)
        : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        users: { total: totalUsers, freelancers: totalFreelancers, clients: totalClients, recentSignups },
        gigs: { total: totalGigs, active: activeGigs, completed: completedGigs },
        revenue: { totalVolume: revenue.total, platformFees: revenue.platformFees },
        disputes: { open: openDisputes },
        topCategories,
        successRate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL USERS (Admin)
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, suspended } = req.query;

    const query = {};
    if (role) query.role = role;
    if (suspended === "true") query.isSuspended = true;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-resetPasswordToken -emailVerificationToken -twoFactorSecret")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

// ==========================================
// SUSPEND / ACTIVATE USER
// ==========================================
exports.suspendUser = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: "suspend" or "activate"
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend admin accounts.",
      });
    }

    const previousState = { isSuspended: user.isSuspended };

    if (action === "suspend") {
      user.isSuspended = true;
      user.suspensionReason = reason;
    } else {
      user.isSuspended = false;
      user.suspensionReason = undefined;
    }
    await user.save({ validateBeforeSave: false });

    // Log admin action
    await AdminLog.create({
      adminId: req.user._id,
      action: action === "suspend" ? "user_suspended" : "user_activated",
      targetType: "User",
      targetId: user._id,
      details: reason || `User ${action}d`,
      previousState,
      newState: { isSuspended: user.isSuspended },
      ipAddress: req.ip,
    });

    // Notify user
    await Notification.create({
      userId: user._id,
      type: action === "suspend" ? "account_suspended" : "system",
      title: action === "suspend" ? "Account Suspended" : "Account Activated",
      message:
        action === "suspend"
          ? `Your account has been suspended. Reason: ${reason}`
          : "Your account has been reactivated.",
    });

    res.status(200).json({
      success: true,
      message: `User ${action}d successfully.`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user status.",
      error: error.message,
    });
  }
};

// ==========================================
// VERIFY FREELANCER
// ==========================================
exports.verifyFreelancer = async (req, res) => {
  try {
    const { action } = req.body; // "verify" or "reject"

    const profile = await FreelancerProfile.findOne({ userId: req.params.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    profile.verificationStatus = action === "verify" ? "verified" : "unverified";

    if (action === "verify") {
      // Add verified badge
      const hasBadge = profile.badges.some((b) => b.type === "verified");
      if (!hasBadge) {
        profile.badges.push({ type: "verified" });
      }
    }

    await profile.save();

    // Log admin action
    await AdminLog.create({
      adminId: req.user._id,
      action: action === "verify" ? "freelancer_verified" : "freelancer_rejected",
      targetType: "User",
      targetId: req.params.id,
      details: `Freelancer ${action}d`,
      ipAddress: req.ip,
    });

    // Notify freelancer
    await Notification.create({
      userId: req.params.id,
      type: "account_verified",
      title: action === "verify" ? "Profile Verified! ✅" : "Verification Rejected",
      message:
        action === "verify"
          ? "Congratulations! Your freelancer profile has been verified."
          : "Your verification request was not approved. Please update your profile.",
    });

    res.status(200).json({
      success: true,
      message: `Freelancer ${action}d successfully.`,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify freelancer.",
      error: error.message,
    });
  }
};

// ==========================================
// APPROVE GIG
// ==========================================
exports.approveGig = async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }

    gig.isApprovedByAdmin = action === "approve";
    if (action === "reject") {
      gig.status = "closed";
    }
    await gig.save();

    // Log admin action
    await AdminLog.create({
      adminId: req.user._id,
      action: action === "approve" ? "gig_approved" : "gig_rejected",
      targetType: "Gig",
      targetId: gig._id,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Gig ${action}d successfully.`,
      gig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update gig.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL PAYMENTS (Admin)
// ==========================================
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("clientId", "firstName lastName email")
        .populate("freelancerId", "firstName lastName email")
        .populate("gigId", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL DISPUTES (Admin)
// ==========================================
exports.getAllDisputes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate("raisedBy", "firstName lastName email")
        .populate("against", "firstName lastName email")
        .populate("gigId", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dispute.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: disputes.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      disputes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch disputes.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ADMIN LOGS
// ==========================================
exports.getAdminLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;

    const query = {};
    if (action) query.action = action;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .populate("adminId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdminLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin logs.",
      error: error.message,
    });
  }
};
