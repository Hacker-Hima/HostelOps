import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hostelops_default_jwt_secret_dev_key';

/**
 * Authentication Middleware: Verify JWT Bearer token
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
        errorCode: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token format.',
        errorCode: 'INVALID_TOKEN',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please sign in again.',
          errorCode: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or forged authentication token.',
        errorCode: 'TOKEN_INVALID',
      });
    }

    // Try finding in database to verify active status
    let user = null;
    if (decoded.sub) {
      user = await User.findOne({ id: decoded.sub }).lean();
    }
    if (!user && decoded.username) {
      user = await User.findOne({ username: decoded.username.toLowerCase() }).lean();
    }

    if (user && user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact Super Admin.',
        errorCode: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Attach user to request
    req.user = user || {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      admin_type: decoded.admin_type,
      name: decoded.name || decoded.username,
    };

    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.',
      errorCode: 'AUTH_SERVER_ERROR',
    });
  }
}

/**
 * Optional Authentication: Attaches req.user if valid token present, doesn't block if missing
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findOne({ id: decoded.sub }).lean();
          req.user = user || decoded;
        } catch {
          // Token invalid/expired - continue as unauthenticated
        }
      }
    }
    next();
  } catch {
    next();
  }
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(...allowedRoles) {
  const rolesList = allowedRoles.flat().map((r) => String(r || '').toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'AUTH_REQUIRED',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedUserRole = userRole === 'student' ? 'user' : userRole === 'technician' ? 'staff' : userRole;

    const hasRole = rolesList.some((r) => {
      const normalizedRole = r === 'student' ? 'user' : r === 'technician' ? 'staff' : r;
      return userRole === r || normalizedUserRole === normalizedRole;
    });

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires [${rolesList.join(', ')}] permissions. Current role: ${req.user.role}`,
        errorCode: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
}

/**
 * Admin Sub-type Requirement Middleware (e.g. 'superadmin')
 */
export function requireAdminType(...allowedAdminTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'AUTH_REQUIRED',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Requires Administrator privileges.',
        errorCode: 'ADMIN_REQUIRED',
      });
    }

    const currentType = (req.user.admin_type || '').toLowerCase();
    const hasType = allowedAdminTypes.some((t) => t.toLowerCase() === currentType);

    if (!hasType) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires [${allowedAdminTypes.join(', ')}] privileges. Current admin level: ${req.user.admin_type || 'general'}`,
        errorCode: 'INSUFFICIENT_ADMIN_LEVEL',
      });
    }

    next();
  };
}
