const crypto = require("crypto");
const Payment = require("../models/Payment");
const Gig = require("../models/Gig");
const FreelancerProfile = require("../models/FreelancerProfile");
const ClientProfile = require("../models/ClientProfile");
const Notification = require("../models/Notification");
const razorpay = require("../config/razorpay");

// ==========================================
// CREATE RAZORPAY ORDER (Escrow)
// ==========================================
exports.createOrder = async (req, res) => {
  try {
    const { gigId, amount, milestoneId, description } = req.body;

    if (!gigId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Gig ID and amount are required.",
      });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }

    // Only the gig client can create payment
    if (gig.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: `gig_${gigId}_${Date.now()}`,
      notes: {
        gigId,
        clientId: req.user._id.toString(),
        freelancerId: gig.assignedFreelancer?.toString() || "",
        milestoneId: milestoneId || "",
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Calculate platform fee
    const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT) || 10;
    const platformFee = (amount * platformFeePercent) / 100;
    const freelancerPayout = amount - platformFee;

    // Create payment record
    const payment = await Payment.create({
      gigId,
      clientId: req.user._id,
      freelancerId: gig.assignedFreelancer,
      amount,
      platformFee,
      freelancerPayout,
      paymentType: milestoneId ? "milestone" : "escrow",
      milestoneId,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      description,
    });

    res.status(201).json({
      success: true,
      message: "Order created.",
      order: razorpayOrder,
      payment,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create payment order.",
      error: error.message,
    });
  }
};

// ==========================================
// VERIFY PAYMENT
// ==========================================
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // Update payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "held"; // Money in escrow
    await payment.save();

    // Update client total spent
    await ClientProfile.findOneAndUpdate(
      { userId: payment.clientId },
      { $inc: { totalSpent: payment.amount } }
    );

    // Notify freelancer
    if (payment.freelancerId) {
      await Notification.create({
        userId: payment.freelancerId,
        type: "payment_received",
        title: "Payment Secured! 💰",
        message: `A payment of ₹${payment.amount} has been secured in escrow for your gig.`,
        link: `/payments/${payment._id}`,
        relatedId: payment._id,
        relatedModel: "Payment",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and held in escrow.",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment verification failed.",
      error: error.message,
    });
  }
};

// ==========================================
// RELEASE MILESTONE PAYMENT
// ==========================================
exports.releaseMilestonePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    if (payment.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (payment.status !== "held") {
      return res.status(400).json({
        success: false,
        message: `Cannot release a payment with status '${payment.status}'.`,
      });
    }

    payment.status = "released";
    payment.releasedAt = new Date();
    await payment.save();

    // Update freelancer earnings
    await FreelancerProfile.findOneAndUpdate(
      { userId: payment.freelancerId },
      { $inc: { totalEarnings: payment.freelancerPayout } }
    );

    // Update milestone status if applicable
    if (payment.milestoneId) {
      const gig = await Gig.findById(payment.gigId);
      const milestone = gig.milestones.id(payment.milestoneId);
      if (milestone) {
        milestone.status = "paid";
        milestone.completedAt = new Date();
        await gig.save();
      }
    }

    // Notify freelancer
    await Notification.create({
      userId: payment.freelancerId,
      type: "payment_released",
      title: "Payment Released! 🎉",
      message: `₹${payment.freelancerPayout} has been released to your account.`,
      link: `/payments/${payment._id}`,
      relatedId: payment._id,
      relatedModel: "Payment",
    });

    res.status(200).json({
      success: true,
      message: "Payment released to freelancer.",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to release payment.",
      error: error.message,
    });
  }
};

// ==========================================
// REFUND PAYMENT (Admin)
// ==========================================
exports.refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    if (!["held", "pending"].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: "Only held or pending payments can be refunded.",
      });
    }

    payment.status = "refunded";
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    // Notify both parties
    const notifications = [
      {
        userId: payment.clientId,
        type: "payment_refunded",
        title: "Payment Refunded",
        message: `₹${payment.amount} has been refunded for your gig.`,
        link: `/payments/${payment._id}`,
        relatedId: payment._id,
        relatedModel: "Payment",
      },
      {
        userId: payment.freelancerId,
        type: "payment_refunded",
        title: "Payment Refunded",
        message: `A payment of ₹${payment.amount} has been refunded to the client.`,
        link: `/payments/${payment._id}`,
        relatedId: payment._id,
        relatedModel: "Payment",
      },
    ];
    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: "Payment refunded.",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refund payment.",
      error: error.message,
    });
  }
};

// ==========================================
// GET PAYMENT HISTORY
// ==========================================
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {
      $or: [{ clientId: req.user._id }, { freelancerId: req.user._id }],
    };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("gigId", "title")
        .populate("clientId", "firstName lastName")
        .populate("freelancerId", "firstName lastName")
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
      message: "Failed to fetch payment history.",
      error: error.message,
    });
  }
};

// ==========================================
// GET EARNINGS SUMMARY (Freelancer)
// ==========================================
exports.getEarnings = async (req, res) => {
  try {
    const freelancerPayments = await Payment.find({
      freelancerId: req.user._id,
      status: "released",
    });

    const totalEarnings = freelancerPayments.reduce(
      (sum, p) => sum + p.freelancerPayout,
      0
    );
    const totalPlatformFee = freelancerPayments.reduce(
      (sum, p) => sum + p.platformFee,
      0
    );

    // Monthly earnings (last 12 months)
    const monthlyEarnings = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPayments = freelancerPayments.filter(
        (p) => p.releasedAt >= startOfMonth && p.releasedAt <= endOfMonth
      );
      const monthTotal = monthPayments.reduce(
        (sum, p) => sum + p.freelancerPayout,
        0
      );

      monthlyEarnings.push({
        month: startOfMonth.toLocaleString("default", { month: "short" }),
        year: startOfMonth.getFullYear(),
        earnings: monthTotal,
        count: monthPayments.length,
      });
    }

    // Pending payments
    const pendingPayments = await Payment.find({
      freelancerId: req.user._id,
      status: "held",
    });
    const pendingAmount = pendingPayments.reduce(
      (sum, p) => sum + p.freelancerPayout,
      0
    );

    res.status(200).json({
      success: true,
      totalEarnings,
      totalPlatformFee,
      pendingAmount,
      totalTransactions: freelancerPayments.length,
      monthlyEarnings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings.",
      error: error.message,
    });
  }
};
