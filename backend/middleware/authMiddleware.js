const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_asset_management_jwt_secret_mwt_2026';

// General authentication middleware: verifies JWT token
const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Attach authenticated user to request object (excluding password)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User session invalid. Account not found.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[JWT Verification Error]:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please sign in again.',
          expired: true,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. Please sign in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }
};

// Role-based authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Support 'student' and 'user' interchangeably, and 'technician' and 'staff' interchangeably
    const userRole =
      req.user.role === 'student'
        ? 'user'
        : req.user.role === 'staff'
        ? 'technician'
        : req.user.role;
    const normalizedRoles = roles.map((r) =>
      r === 'student' ? 'user' : r === 'staff' ? 'technician' : r
    );

    if (!normalizedRoles.includes(userRole) && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' lacks sufficient privileges.`,
      });
    }
    next();
  };
};

// Aliases for convenience matching MWT specification
const adminMiddleware = [authMiddleware, authorize('admin')];
const userMiddleware = [authMiddleware, authorize('student', 'user')];
const technicianMiddleware = [authMiddleware, authorize('technician', 'staff', 'admin')];

module.exports = {
  protect: authMiddleware,
  authMiddleware,
  authorize,
  adminMiddleware,
  userMiddleware,
  technicianMiddleware,
};
