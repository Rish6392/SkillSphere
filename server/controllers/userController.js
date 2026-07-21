const User = require("../models/User");
const FreelancerProfile = require("../models/FreelancerProfile");
const ClientProfile = require("../models/ClientProfile");
const { uploadToCloudinary, deleteFromCloudinary } = require("../middlewares/upload");

// ==========================================
// GET OWN PROFILE
// ==========================================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === "freelancer") {
      profile = await FreelancerProfile.findOne({ userId: user._id });
    } else if (user.role === "client") {
      profile = await ClientProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user,
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
// UPDATE OWN PROFILE
// ==========================================
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, location } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

// ==========================================
// UPLOAD AVATAR
// ==========================================
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file.",
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "avatars");

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully.",
      avatar: result.secure_url,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload avatar.",
      error: error.message,
    });
  }
};

// ==========================================
// VIEW ANY USER'S PUBLIC PROFILE
// ==========================================
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -twoFactorSecret"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let profile = null;
    if (user.role === "freelancer") {
      profile = await FreelancerProfile.findOne({ userId: user._id });
      // Increment profile views
      if (profile) {
        profile.profileViews += 1;
        await profile.save();
      }
    } else if (user.role === "client") {
      profile = await ClientProfile.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE ACCOUNT
// ==========================================
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    // Clear cookie
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete account.",
      error: error.message,
    });
  }
};
