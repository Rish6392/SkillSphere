const crypto = require("crypto");
const User = require("../models/User");
const FreelancerProfile = require("../models/FreelancerProfile");
const ClientProfile = require("../models/ClientProfile");
const generateToken = require("../utils/generateToken");
const mailSender = require("../utils/mailSender");

// ==========================================
// REGISTER
// ==========================================
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, location } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Validate role
    const validRoles = ["client", "freelancer"];
    const userRole = validRoles.includes(role) ? role : "client";

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: userRole,
      phone,
      location,
    });

    // Create role-specific profile
    if (userRole === "freelancer") {
      await FreelancerProfile.create({ userId: user._id });
    } else {
      await ClientProfile.create({ userId: user._id });
    }

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Welcome to SkillSphere!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email Address
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">SkillSphere - Intelligent Hyperlocal Freelance Ecosystem</p>
      </div>
    `;

    try {
      await mailSender(email, "Verify Your SkillSphere Account", emailHtml);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // Don't block registration if email fails
    }

    // Generate JWT token
    const token = generateToken(user, res);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message,
    });
  }
};

// ==========================================
// VERIFY EMAIL
// ==========================================
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed.",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Contact support.",
      });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        tempUserId: user._id,
        message: "Please enter your 2FA code.",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user, res);
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================
exports.logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};

// ==========================================
// GET CURRENT USER (ME)
// ==========================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get role-specific profile
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
      message: "Failed to fetch user data.",
    });
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security)
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">SkillSphere - Intelligent Hyperlocal Freelance Ecosystem</p>
      </div>
    `;

    await mailSender(email, "SkillSphere - Password Reset", emailHtml);

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request.",
    });
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed.",
    });
  }
};

// ==========================================
// GOOGLE OAUTH LOGIN/REGISTER
// ==========================================
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, firstName, lastName, avatar, role } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: "Google authentication data is incomplete.",
      });
    }

    // Check if user exists with this Google ID or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Existing user — update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // New user — create account
      const userRole = ["client", "freelancer"].includes(role) ? role : "client";

      user = await User.create({
        firstName,
        lastName,
        email,
        password: crypto.randomBytes(16).toString("hex"), // Random password for OAuth users
        googleId,
        avatar: avatar || "",
        role: userRole,
        isEmailVerified: true, // Google email is pre-verified
      });

      // Create role-specific profile
      if (userRole === "freelancer") {
        await FreelancerProfile.create({ userId: user._id });
      } else {
        await ClientProfile.create({ userId: user._id });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user, res);
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Google authentication successful!",
      token,
      user,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Google authentication failed.",
    });
  }
};

// ==========================================
// CHANGE PASSWORD (authenticated)
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
};
