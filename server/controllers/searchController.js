const Gig = require("../models/Gig");
const FreelancerProfile = require("../models/FreelancerProfile");
const User = require("../models/User");

// ==========================================
// SEARCH GIGS
// ==========================================
exports.searchGigs = async (req, res) => {
  try {
    const {
      q,
      category,
      skills,
      budgetType,
      minBudget,
      maxBudget,
      isRemote,
      city,
      state,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = { status: "open" };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Category filter
    if (category) query.category = new RegExp(category, "i");

    // Skills filter
    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      query.skills = { $in: skillArray.map((s) => new RegExp(s, "i")) };
    }

    // Budget filters
    if (budgetType) query.budgetType = budgetType;
    if (minBudget) query["budgetRange.min"] = { $gte: Number(minBudget) };
    if (maxBudget) query["budgetRange.max"] = { $lte: Number(maxBudget) };

    // Location filters
    if (isRemote !== undefined) query.isRemote = isRemote === "true";
    if (city) query["location.city"] = new RegExp(city, "i");
    if (state) query["location.state"] = new RegExp(state, "i");

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
      message: "Failed to search gigs.",
      error: error.message,
    });
  }
};

// ==========================================
// SEARCH FREELANCERS
// ==========================================
exports.searchFreelancers = async (req, res) => {
  try {
    const {
      q,
      skills,
      minRating,
      maxRate,
      minRate,
      availability,
      verified,
      city,
      state,
      category,
      sortBy = "reputationScore",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const profileQuery = {};

    // Text search
    if (q) {
      profileQuery.$text = { $search: q };
    }

    // Skills filter
    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      profileQuery["skills.name"] = {
        $in: skillArray.map((s) => new RegExp(s, "i")),
      };
    }

    // Rating filter
    if (minRating) {
      profileQuery.reputationScore = { $gte: Number(minRating) };
    }

    // Rate filter
    if (minRate || maxRate) {
      profileQuery["pricing.hourlyRate"] = {};
      if (minRate) profileQuery["pricing.hourlyRate"].$gte = Number(minRate);
      if (maxRate) profileQuery["pricing.hourlyRate"].$lte = Number(maxRate);
    }

    // Availability filter
    if (availability) {
      profileQuery["availability.status"] = availability;
    }

    // Verification filter
    if (verified === "true") {
      profileQuery.verificationStatus = "verified";
    }

    // Category filter
    if (category) {
      profileQuery.categories = new RegExp(category, "i");
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    let [profiles, total] = await Promise.all([
      FreelancerProfile.find(profileQuery)
        .populate("userId", "firstName lastName avatar location phone")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      FreelancerProfile.countDocuments(profileQuery),
    ]);

    // Filter by location (from User model)
    if (city || state) {
      profiles = profiles.filter((p) => {
        if (!p.userId?.location) return false;
        if (city && !new RegExp(city, "i").test(p.userId.location.city)) return false;
        if (state && !new RegExp(state, "i").test(p.userId.location.state))
          return false;
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      freelancers: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search freelancers.",
      error: error.message,
    });
  }
};
