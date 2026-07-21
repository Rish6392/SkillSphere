const Proposal = require("../models/Proposal");
const Gig = require("../models/Gig");
const Notification = require("../models/Notification");
const FreelancerProfile = require("../models/FreelancerProfile");

// ==========================================
// SUBMIT PROPOSAL
// ==========================================
exports.submitProposal = async (req, res) => {
  try {
    const { gigId, coverLetter, bidAmount, estimatedDuration } = req.body;

    if (!gigId || !coverLetter || !bidAmount || !estimatedDuration) {
      return res.status(400).json({
        success: false,
        message: "Please provide gigId, coverLetter, bidAmount, and estimatedDuration.",
      });
    }

    // Check if gig exists and is open
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }
    if (gig.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This gig is not accepting proposals.",
      });
    }

    // Freelancer can't bid on own gig
    if (gig.clientId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot bid on your own gig.",
      });
    }

    // Check for duplicate proposal
    const existingProposal = await Proposal.findOne({
      gigId,
      freelancerId: req.user._id,
    });
    if (existingProposal) {
      return res.status(400).json({
        success: false,
        message: "You've already submitted a proposal for this gig.",
      });
    }

    const proposal = await Proposal.create({
      gigId,
      freelancerId: req.user._id,
      coverLetter,
      bidAmount,
      estimatedDuration,
    });

    // Increment proposal count on gig
    gig.proposalCount += 1;
    await gig.save();

    // Notify the client
    await Notification.create({
      userId: gig.clientId,
      type: "proposal_received",
      title: "New Proposal Received",
      message: `A freelancer submitted a proposal for "${gig.title}" with a bid of ₹${bidAmount}.`,
      link: `/gigs/${gigId}/proposals`,
      relatedId: proposal._id,
      relatedModel: "Proposal",
    });

    res.status(201).json({
      success: true,
      message: "Proposal submitted successfully!",
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit proposal.",
      error: error.message,
    });
  }
};

// ==========================================
// GET PROPOSALS FOR A GIG (Client)
// ==========================================
exports.getGigProposals = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }

    // Only gig owner can see proposals
    if (gig.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the gig owner can view proposals.",
      });
    }

    const proposals = await Proposal.find({ gigId: req.params.gigId })
      .populate("freelancerId", "firstName lastName avatar location")
      .sort({ createdAt: -1 });

    // Enrich with freelancer profile data
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const freelancerProfile = await FreelancerProfile.findOne({
          userId: proposal.freelancerId._id,
        }).select("headline skills reputationScore completedJobs");

        return {
          ...proposal.toObject(),
          freelancerProfile,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedProposals.length,
      proposals: enrichedProposals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch proposals.",
      error: error.message,
    });
  }
};

// ==========================================
// GET PROPOSAL BY ID
// ==========================================
exports.getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate("freelancerId", "firstName lastName avatar location")
      .populate("gigId", "title budgetRange status clientId");

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    // Only freelancer who submitted or gig owner can view
    const isFreelancer = proposal.freelancerId._id.toString() === req.user._id.toString();
    const isClient = proposal.gigId.clientId.toString() === req.user._id.toString();

    if (!isFreelancer && !isClient && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    res.status(200).json({
      success: true,
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch proposal.",
      error: error.message,
    });
  }
};

// ==========================================
// ACCEPT PROPOSAL (Client)
// ==========================================
exports.acceptProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("gigId");

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    // Verify client owns the gig
    if (proposal.gigId.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (proposal.status !== "pending" && proposal.status !== "shortlisted") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept a proposal with status '${proposal.status}'.`,
      });
    }

    // Accept this proposal
    proposal.status = "accepted";
    proposal.acceptedAt = new Date();
    await proposal.save();

    // Update gig — assign freelancer, change status
    const gig = await Gig.findById(proposal.gigId._id);
    gig.assignedFreelancer = proposal.freelancerId;
    gig.status = "in_progress";
    await gig.save();

    // Reject all other pending proposals for this gig
    await Proposal.updateMany(
      {
        gigId: proposal.gigId._id,
        _id: { $ne: proposal._id },
        status: { $in: ["pending", "shortlisted"] },
      },
      {
        status: "rejected",
        rejectedAt: new Date(),
        clientNote: "Another proposal was accepted.",
      }
    );

    // Notify the accepted freelancer
    await Notification.create({
      userId: proposal.freelancerId,
      type: "proposal_accepted",
      title: "Proposal Accepted! 🎉",
      message: `Your proposal for "${gig.title}" has been accepted!`,
      link: `/gigs/${gig._id}`,
      relatedId: proposal._id,
      relatedModel: "Proposal",
    });

    res.status(200).json({
      success: true,
      message: "Proposal accepted! The gig is now in progress.",
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to accept proposal.",
      error: error.message,
    });
  }
};

// ==========================================
// REJECT PROPOSAL (Client)
// ==========================================
exports.rejectProposal = async (req, res) => {
  try {
    const { note } = req.body;
    const proposal = await Proposal.findById(req.params.id).populate("gigId");

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    if (proposal.gigId.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    proposal.status = "rejected";
    proposal.rejectedAt = new Date();
    if (note) proposal.clientNote = note;
    await proposal.save();

    // Notify freelancer
    await Notification.create({
      userId: proposal.freelancerId,
      type: "proposal_rejected",
      title: "Proposal Update",
      message: `Your proposal for "${proposal.gigId.title}" was not selected.`,
      link: `/proposals/${proposal._id}`,
      relatedId: proposal._id,
      relatedModel: "Proposal",
    });

    res.status(200).json({
      success: true,
      message: "Proposal rejected.",
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject proposal.",
      error: error.message,
    });
  }
};

// ==========================================
// NEGOTIATE PROPOSAL (Client)
// ==========================================
exports.negotiateProposal = async (req, res) => {
  try {
    const { amount, message } = req.body;
    const proposal = await Proposal.findById(req.params.id).populate("gigId");

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    if (proposal.gigId.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    proposal.negotiationHistory.push({
      proposedBy: "client",
      amount,
      message,
    });
    await proposal.save();

    // Notify freelancer
    await Notification.create({
      userId: proposal.freelancerId,
      type: "proposal_received",
      title: "Counter Offer Received",
      message: `The client has made a counter offer of ₹${amount} for "${proposal.gigId.title}".`,
      link: `/proposals/${proposal._id}`,
      relatedId: proposal._id,
      relatedModel: "Proposal",
    });

    res.status(200).json({
      success: true,
      message: "Counter offer sent.",
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to negotiate.",
      error: error.message,
    });
  }
};

// ==========================================
// WITHDRAW PROPOSAL (Freelancer)
// ==========================================
exports.withdrawProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    if (proposal.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (proposal.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Cannot withdraw an accepted proposal.",
      });
    }

    proposal.status = "withdrawn";
    await proposal.save();

    // Decrement proposal count on gig
    await Gig.findByIdAndUpdate(proposal.gigId, { $inc: { proposalCount: -1 } });

    res.status(200).json({
      success: true,
      message: "Proposal withdrawn.",
      proposal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to withdraw proposal.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY PROPOSALS (Freelancer)
// ==========================================
exports.getMyProposals = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { freelancerId: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate("gigId", "title budgetRange status clientId category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Proposal.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: proposals.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      proposals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your proposals.",
      error: error.message,
    });
  }
};
