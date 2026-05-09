/**
 * Middleware to restrict access to suspended/blocked users
 * except for specific pages like suspension appeal
 */
export const checkAccountStatus = (allowedForSuspended = false) => {
  return (req, res, next) => {
    // Skip if no user
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if account is blocked
    if (req.user.accountStatus === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Account has been permanently blocked',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // Check if account is suspended
    if (req.user.accountStatus === 'suspended' && !allowedForSuspended) {
      return res.status(403).json({
        success: false,
        message:
          'Account is currently suspended. Please submit an appeal to regain access.',
        code: 'ACCOUNT_SUSPENDED',
        suspensionReason: req.user.statusReason,
        statusUpdatedAt: req.user.statusUpdatedAt,
      });
    }

    next();
  };
};

/**
 * Middleware to allow full access only to suspended/blocked users for specific endpoints
 * (like suspension appeal submission)
 */
export const allowSuspendedOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.accountStatus === 'active') {
    return res.status(400).json({
      success: false,
      message: 'Only suspended accounts can access this endpoint',
    });
  }

  next();
};
