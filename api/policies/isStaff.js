/**
 * isStaff
 *
 * Ensures the authenticated user has 'staff' or 'admin' role.
 * Must be used after isAuthenticated.
 */

module.exports = async function (req, res, proceed) {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or admin role required.',
    });
  }
  return proceed();
};
