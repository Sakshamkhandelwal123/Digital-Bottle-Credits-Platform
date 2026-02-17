/**
 * isAdminOrStaff
 *
 * Ensures the authenticated user has 'admin' or 'staff' role.
 * Must be used after isAuthenticated.
 */

module.exports = async function (req, res, proceed) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or staff role required.',
    });
  }
  return proceed();
};
