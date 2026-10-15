const permissionResolver = (requiredPermission) => {
  return (req, res, next) => {
    // If no user attached or system internal, allow
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Token required' });
    }

    // Admins bypass granular permission checks
    if (req.user.role === 'admin' || req.user.role === 'System Administrator') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - Missing required permission: ${requiredPermission}`
      });
    }

    next();
  };
};

module.exports = permissionResolver;
