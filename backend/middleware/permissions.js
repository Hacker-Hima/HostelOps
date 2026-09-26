/**
 * HostelOps Enterprise Granular Permissions Matrix
 */

export const PERMISSIONS = {
  // Assets
  ASSET_VIEW: 'ASSET_VIEW',
  ASSET_CREATE: 'ASSET_CREATE',
  ASSET_EDIT: 'ASSET_EDIT',
  ASSET_DELETE: 'ASSET_DELETE',
  ASSET_ASSIGN: 'ASSET_ASSIGN',
  ASSET_TRANSFER: 'ASSET_TRANSFER',
  ASSET_DISPOSE: 'ASSET_DISPOSE',

  // Audits
  AUDIT_VIEW: 'AUDIT_VIEW',
  AUDIT_CREATE: 'AUDIT_CREATE',
  AUDIT_APPROVE: 'AUDIT_APPROVE',

  // Maintenance & Tickets
  MAINTENANCE_VIEW: 'MAINTENANCE_VIEW',
  MAINTENANCE_CREATE: 'MAINTENANCE_CREATE',
  MAINTENANCE_ASSIGN: 'MAINTENANCE_ASSIGN',
  MAINTENANCE_UPDATE: 'MAINTENANCE_UPDATE',
  MAINTENANCE_CLOSE: 'MAINTENANCE_CLOSE',

  // Asset Requests
  REQUEST_CREATE: 'REQUEST_CREATE',
  REQUEST_VIEW_OWN: 'REQUEST_VIEW_OWN',
  REQUEST_VIEW_ALL: 'REQUEST_VIEW_ALL',
  REQUEST_APPROVE: 'REQUEST_APPROVE',

  // Hierarchy: Rooms & Residents
  ROOM_VIEW: 'ROOM_VIEW',
  ROOM_MANAGE: 'ROOM_MANAGE',
  RESIDENT_VIEW: 'RESIDENT_VIEW',
  RESIDENT_MANAGE: 'RESIDENT_MANAGE',

  // Procurement & Vendors
  PROCUREMENT_VIEW: 'PROCUREMENT_VIEW',
  PROCUREMENT_CREATE: 'PROCUREMENT_CREATE',
  PROCUREMENT_APPROVE: 'PROCUREMENT_APPROVE',
  VENDOR_MANAGE: 'VENDOR_MANAGE',

  // Budget & Financials
  BUDGET_VIEW: 'BUDGET_VIEW',
  BUDGET_APPROVE: 'BUDGET_APPROVE',

  // Users & Administration
  USER_VIEW: 'USER_VIEW',
  USER_MANAGE: 'USER_MANAGE',

  // Analytics & Exports
  REPORT_EXPORT: 'REPORT_EXPORT',
};

// Maps roles & admin types to granted permissions
export const ROLE_PERMISSIONS = {
  superadmin: Object.values(PERMISSIONS),

  assetadmin: [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_EDIT,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.ASSET_TRANSFER,
    PERMISSIONS.ASSET_DISPOSE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_CREATE,
    PERMISSIONS.AUDIT_APPROVE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_ASSIGN,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.MAINTENANCE_CLOSE,
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.REQUEST_APPROVE,
    PERMISSIONS.ROOM_VIEW,
    PERMISSIONS.ROOM_MANAGE,
    PERMISSIONS.RESIDENT_VIEW,
    PERMISSIONS.RESIDENT_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_CREATE,
    PERMISSIONS.PROCUREMENT_APPROVE,
    PERMISSIONS.VENDOR_MANAGE,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],

  warden: [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.ASSET_ASSIGN,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_CREATE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_ASSIGN,
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.REQUEST_APPROVE,
    PERMISSIONS.ROOM_VIEW,
    PERMISSIONS.ROOM_MANAGE,
    PERMISSIONS.RESIDENT_VIEW,
    PERMISSIONS.RESIDENT_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_CREATE,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.REPORT_EXPORT,
  ],

  staff: [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_CREATE,
    PERMISSIONS.ROOM_VIEW,
  ],

  technician: [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_CREATE,
    PERMISSIONS.ROOM_VIEW,
  ],

  user: [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_VIEW_OWN,
    PERMISSIONS.ROOM_VIEW,
  ],

  student: [
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_VIEW_OWN,
    PERMISSIONS.ROOM_VIEW,
  ],
};

/**
 * Check if a user has a given permission
 */
export function hasPermission(user, requiredPermission) {
  if (!user) return false;

  // Super admin has all permissions
  if (user.role === 'admin' && (user.admin_type === 'superadmin' || !user.admin_type)) {
    return true;
  }

  // Specific admin type
  if (user.role === 'admin' && user.admin_type && ROLE_PERMISSIONS[user.admin_type.toLowerCase()]) {
    return ROLE_PERMISSIONS[user.admin_type.toLowerCase()].includes(requiredPermission);
  }

  const roleKey = (user.role || '').toLowerCase();
  const permissions = ROLE_PERMISSIONS[roleKey] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Express middleware to enforce a specific permission
 */
export function requirePermission(...neededPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access this resource.',
        errorCode: 'AUTH_REQUIRED',
      });
    }

    const permitted = neededPermissions.some((p) => hasPermission(req.user, p));
    if (!permitted) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires [${neededPermissions.join(', ')}] permissions.`,
        errorCode: 'PERMISSION_DENIED',
      });
    }

    next();
  };
}
