/**
 * isAdmin
 *
 * Ensures the authenticated user has the 'admin' role.
 * Must be used after isAuthenticated.
 */

module.exports = async function (req, res, proceed) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  return proceed();
};
