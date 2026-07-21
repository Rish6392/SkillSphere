const Gig = require("../models/Gig");
const Proposal = require("../models/Proposal");
const ClientProfile = require("../models/ClientProfile");
const Notification = require("../models/Notification");
const { uploadToCloudinary } = require("../middlewares/upload");

// ==========================================
// CREATE GIG
// ==========================================
exports.createGig = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      skills,
      budgetType,
      budgetRange,
      milestones,
      location,
      isRemote,
      deadline,
      estimatedDuration,
      visibility,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !budgetType || !budgetRange) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: title, description, category, budgetType, budgetRange.",
      });
    }

    const gig = await Gig.create({
      clientId: req.user._id,
      title,
      description,
      category,
      subCategory,
      skills: skills || [],
      budgetType,
      budgetRange,
      milestones: milestones || [],
      location,
      isRemote: isRemote !== undefined ? isRemote : true,
      deadline,
      estimatedDuration,
      visibility: visibility || "public",
    });

    // Update client active gigs count
    await ClientProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { activeGigs: 1 } }
    );

    res.status(201).json({
      success: true,
      message: "Gig created successfully!",
      gig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create gig.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL GIGS (with filtering & pagination)
// ==========================================
exports.getAllGigs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      budgetType,
      minBudget,
      maxBudget,
      skills,
      status = "open",
      sortBy = "createdAt",
      order = "desc",
      search,
      isRemote,
      city,
    } = req.query;

    const query = { status };

    // Filters
    if (category) query.category = category;
    if (budgetType) query.budgetType = budgetType;
    if (isRemote !== undefined) query.isRemote = isRemote === "true";
    if (city) query["location.city"] = new RegExp(city, "i");

    if (minBudget || maxBudget) {
      query["budgetRange.min"] = {};
      if (minBudget) query["budgetRange.min"].$gte = Number(minBudget);
      if (maxBudget) query["budgetRange.max"] = { $lte: Number(maxBudget) };
    }

    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      query.skills = { $in: skillArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const [gigs, total] = await Promise.all([
      Gig.find(query)
        .populate("clientId", "firstName lastName avatar location")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Gig.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: gigs.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      gigs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gigs.",
      error: error.message,
    });
  }
};

// ==========================================
// GET GIG BY ID
// ==========================================
exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate("clientId", "firstName lastName avatar location createdAt")
      .populate("assignedFreelancer", "firstName lastName avatar");

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found.",
      });
    }

    res.status(200).json({
      success: true,
      gig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gig.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE GIG
// ==========================================
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found.",
      });
    }

    // Only the gig owner can update
    if (gig.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own gigs.",
      });
    }

    // Can't update completed/cancelled gigs
    if (["completed", "cancelled"].includes(gig.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${gig.status} gig.`,
      });
    }

    const allowedUpdates = [
      "title", "description", "category", "subCategory", "skills",
      "budgetType", "budgetRange", "milestones", "location", "isRemote",
      "deadline", "estimatedDuration", "visibility",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        gig[field] = req.body[field];
      }
    });

    await gig.save();

    res.status(200).json({
      success: true,
      message: "Gig updated successfully.",
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
// CHANGE GIG STATUS
// ==========================================
exports.changeGigStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found.",
      });
    }

    if (gig.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only change status of your own gigs.",
      });
    }

    const validTransitions = {
      draft: ["open"],
      open: ["in_progress", "cancelled", "closed"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
      closed: ["open"],
    };

    if (!validTransitions[gig.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${gig.status}' to '${status}'.`,
      });
    }

    gig.status = status;
    await gig.save();

    // Update client active gigs count
    if (["completed", "cancelled", "closed"].includes(status)) {
      await ClientProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { activeGigs: -1 } }
      );
    }
    if (status === "completed") {
      await ClientProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { completedProjects: 1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Gig status changed to '${status}'.`,
      gig,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change gig status.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY GIGS (Client)
// ==========================================
exports.getMyGigs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { clientId: req.user._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [gigs, total] = await Promise.all([
      Gig.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("assignedFreelancer", "firstName lastName avatar"),
      Gig.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: gigs.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      gigs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your gigs.",
      error: error.message,
    });
  }
};

// ==========================================
// UPLOAD GIG ATTACHMENTS
// ==========================================
exports.uploadAttachments = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: "Gig not found.",
      });
    }

    if (gig.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only upload to your own gigs.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one file.",
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer, "gig-attachments");
      return {
        fileName: file.originalname,
        fileUrl: result.secure_url,
        publicId: result.public_id,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    gig.attachments.push(...uploadedFiles);
    await gig.save();

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully.",
      attachments: gig.attachments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload attachments.",
      error: error.message,
    });
  }
};

// ==========================================
// INVITE FREELANCER TO GIG
// ==========================================
exports.inviteFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.body;
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found." });
    }

    if (gig.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (gig.invitedFreelancers.includes(freelancerId)) {
      return res.status(400).json({
        success: false,
        message: "Freelancer already invited.",
      });
    }

    gig.invitedFreelancers.push(freelancerId);
    await gig.save();

    // Create notification for the freelancer
    await Notification.create({
      userId: freelancerId,
      type: "gig_posted",
      title: "You've been invited to a gig!",
      message: `You've been invited to work on "${gig.title}".`,
      link: `/gigs/${gig._id}`,
      relatedId: gig._id,
      relatedModel: "Gig",
    });

    res.status(200).json({
      success: true,
      message: "Freelancer invited successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to invite freelancer.",
      error: error.message,
    });
  }
};
