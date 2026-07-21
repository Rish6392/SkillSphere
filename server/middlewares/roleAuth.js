// ==========================================
// Role-Based Access Control (RBAC) Middleware
// ==========================================

/**
 * Authorize specific roles to access a route
 * Usage: authorize("admin") or authorize("client", "freelancer")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        requiredRoles: roles,
      });
    }

    next();
  };
};

/**
 * Check if user is verified (email verified)
 */
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address before accessing this resource.",
    });
  }
  next();
};

module.exports = { authorize, requireVerifiedEmail };
