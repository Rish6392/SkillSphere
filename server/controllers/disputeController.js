const Dispute = require("../models/Dispute");
const Gig = require("../models/Gig");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const { uploadToCloudinary } = require("../middlewares/upload");

// ==========================================
// RAISE DISPUTE
// ==========================================
exports.raiseDispute = async (req, res) => {
  try {
    const { gigId, against, reason, description, paymentId } = req.body;

    if (!gigId || !against || !reason || !description) {
      return res.status(400).json({
        success: false,
        message: "gigId, against, reason, and description are required.",
      });
    }

    // Verify gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }

    // Verify user is part of the gig
    const isClient = gig.clientId.toString() === req.user._id.toString();
    const isFreelancer =
      gig.assignedFreelancer?.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: "Only gig participants can raise disputes.",
      });
    }

    // Check for existing open dispute on this gig
    const existingDispute = await Dispute.findOne({
      gigId,
      raisedBy: req.user._id,
      status: { $in: ["open", "under_review"] },
    });

    if (existingDispute) {
      return res.status(400).json({
        success: false,
        message: "You already have an open dispute for this gig.",
      });
    }

    const dispute = await Dispute.create({
      gigId,
      raisedBy: req.user._id,
      against,
      reason,
      description,
      paymentId,
    });

    // Freeze any held payments for this gig
    if (paymentId) {
      await Payment.findByIdAndUpdate(paymentId, {
        description: "Payment frozen due to dispute",
      });
    }

    // Notify the other party
    await Notification.create({
      userId: against,
      type: "dispute_opened",
      title: "Dispute Raised",
      message: `A dispute has been raised for "${gig.title}". Reason: ${reason}.`,
      link: `/disputes/${dispute._id}`,
      relatedId: dispute._id,
      relatedModel: "Dispute",
    });

    res.status(201).json({
      success: true,
      message: "Dispute raised successfully. Admin will review shortly.",
      dispute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to raise dispute.",
      error: error.message,
    });
  }
};

// ==========================================
// GET DISPUTE BY ID
// ==========================================
exports.getDispute = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("raisedBy", "firstName lastName avatar")
      .populate("against", "firstName lastName avatar")
      .populate("gigId", "title")
      .populate("assignedAdmin", "firstName lastName")
      .populate("resolvedBy", "firstName lastName");

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    // Only participants and admin can view
    const isParticipant =
      dispute.raisedBy._id.toString() === req.user._id.toString() ||
      dispute.against._id.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    res.status(200).json({
      success: true,
      dispute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispute.",
      error: error.message,
    });
  }
};

// ==========================================
// UPLOAD EVIDENCE
// ==========================================
exports.uploadEvidence = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    // Only participants can upload evidence
    const isParticipant =
      dispute.raisedBy.toString() === req.user._id.toString() ||
      dispute.against.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one file.",
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, "dispute-evidence");
      return {
        fileName: file.originalname,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        uploadedBy: req.user._id,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    dispute.evidence.push(...uploadedFiles);
    await dispute.save();

    res.status(200).json({
      success: true,
      message: "Evidence uploaded successfully.",
      evidence: dispute.evidence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload evidence.",
      error: error.message,
    });
  }
};

// ==========================================
// RESOLVE DISPUTE (Admin)
// ==========================================
exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, resolutionDetails } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    dispute.status = "resolved";
    dispute.resolution = resolution;
    dispute.resolutionDetails = resolutionDetails;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = req.user._id;
    await dispute.save();

    // Handle resolution actions
    if (resolution === "refund_full" && dispute.paymentId) {
      await Payment.findByIdAndUpdate(dispute.paymentId, {
        status: "refunded",
        refundReason: `Dispute resolved: ${resolutionDetails}`,
        refundedAt: new Date(),
      });
    }

    // Notify both parties
    const notifications = [
      {
        userId: dispute.raisedBy,
        type: "dispute_resolved",
        title: "Dispute Resolved",
        message: `Your dispute has been resolved. Resolution: ${resolution}.`,
        link: `/disputes/${dispute._id}`,
        relatedId: dispute._id,
        relatedModel: "Dispute",
      },
      {
        userId: dispute.against,
        type: "dispute_resolved",
        title: "Dispute Resolved",
        message: `A dispute against you has been resolved. Resolution: ${resolution}.`,
        link: `/disputes/${dispute._id}`,
        relatedId: dispute._id,
        relatedModel: "Dispute",
      },
    ];
    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: "Dispute resolved.",
      dispute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resolve dispute.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY DISPUTES
// ==========================================
exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ raisedBy: req.user._id }, { against: req.user._id }],
    })
      .populate("raisedBy", "firstName lastName")
      .populate("against", "firstName lastName")
      .populate("gigId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
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
