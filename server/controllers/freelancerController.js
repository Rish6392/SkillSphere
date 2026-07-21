const FreelancerProfile = require("../models/FreelancerProfile");
const User = require("../models/User");
const { uploadToCloudinary, deleteFromCloudinary } = require("../middlewares/upload");

// ==========================================
// CREATE / UPDATE FREELANCER PROFILE
// ==========================================
exports.updateFreelancerProfile = async (req, res) => {
  try {
    const {
      headline,
      bio,
      skills,
      pricing,
      categories,
      workExperience,
      certifications,
    } = req.body;

    let profile = await FreelancerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new FreelancerProfile({ userId: req.user._id });
    }

    // Update fields if provided
    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (skills !== undefined) profile.skills = skills;
    if (pricing !== undefined) profile.pricing = pricing;
    if (categories !== undefined) profile.categories = categories;
    if (workExperience !== undefined) profile.workExperience = workExperience;
    if (certifications !== undefined) profile.certifications = certifications;

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Freelancer profile updated successfully.",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update freelancer profile.",
      error: error.message,
    });
  }
};

// ==========================================
// GET OWN FREELANCER PROFILE
// ==========================================
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({
      userId: req.user._id,
    }).populate("userId", "firstName lastName email avatar phone location");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: error.message,
    });
  }
};

// ==========================================
// GET FREELANCER PROFILE BY ID (Public)
// ==========================================
exports.getFreelancerById = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({
      userId: req.params.id,
    }).populate("userId", "firstName lastName email avatar phone location createdAt");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer not found.",
      });
    }

    // Increment profile views
    profile.profileViews += 1;
    await profile.save();

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch freelancer profile.",
      error: error.message,
    });
  }
};

// ==========================================
// ADD PORTFOLIO ITEM
// ==========================================
exports.addPortfolioItem = async (req, res) => {
  try {
    const { title, description, link, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Portfolio item title is required.",
      });
    }

    const profile = await FreelancerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    const portfolioItem = {
      title,
      description,
      link,
      tags: tags || [],
    };

    // Upload image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "portfolio");
      portfolioItem.image = result.secure_url;
    }

    profile.portfolio.push(portfolioItem);
    await profile.save();

    res.status(201).json({
      success: true,
      message: "Portfolio item added successfully.",
      portfolio: profile.portfolio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add portfolio item.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE PORTFOLIO ITEM
// ==========================================
exports.deletePortfolioItem = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    const itemIndex = profile.portfolio.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Portfolio item not found.",
      });
    }

    profile.portfolio.splice(itemIndex, 1);
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Portfolio item deleted successfully.",
      portfolio: profile.portfolio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete portfolio item.",
      error: error.message,
    });
  }
};

// ==========================================
// UPLOAD RESUME
// ==========================================
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file.",
      });
    }

    const profile = await FreelancerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    // Delete old resume from Cloudinary if exists
    if (profile.resume?.publicId) {
      await deleteFromCloudinary(profile.resume.publicId);
    }

    // Upload new resume
    const result = await uploadToCloudinary(req.file.buffer, "resumes");

    profile.resume = {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
    };
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully.",
      resume: profile.resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload resume.",
      error: error.message,
    });
  }
};

// ==========================================
// ADD CERTIFICATION
// ==========================================
exports.addCertification = async (req, res) => {
  try {
    const { name, issuer, year, certificateUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Certification name is required.",
      });
    }

    const profile = await FreelancerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    profile.certifications.push({ name, issuer, year, certificateUrl });
    await profile.save();

    res.status(201).json({
      success: true,
      message: "Certification added successfully.",
      certifications: profile.certifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add certification.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE AVAILABILITY
// ==========================================
exports.updateAvailability = async (req, res) => {
  try {
    const { status, slots } = req.body;

    const profile = await FreelancerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Freelancer profile not found.",
      });
    }

    if (status) profile.availability.status = status;
    if (slots) profile.availability.slots = slots;
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully.",
      availability: profile.availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update availability.",
      error: error.message,
    });
  }
};

// ==========================================
// GET TOP RATED FREELANCERS
// ==========================================
exports.getTopFreelancers = async (req, res) => {
  try {
    const { limit = 10, category, city } = req.query;

    const query = { verificationStatus: "verified" };
    if (category) query.categories = category;

    let profiles = await FreelancerProfile.find(query)
      .sort({ reputationScore: -1, completedJobs: -1 })
      .limit(parseInt(limit))
      .populate("userId", "firstName lastName avatar location");

    // Filter by city if provided
    if (city) {
      profiles = profiles.filter(
        (p) =>
          p.userId?.location?.city?.toLowerCase() === city.toLowerCase()
      );
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch top freelancers.",
      error: error.message,
    });
  }
};
