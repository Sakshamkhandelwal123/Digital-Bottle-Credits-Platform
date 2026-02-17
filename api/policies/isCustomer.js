/**
 * isCustomer
 *
 * Ensures the authenticated user has the 'customer' role.
 * Must be used after isAuthenticated.
 */

module.exports = async function (req, res, proceed) {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.',
    });
  }
  return proceed();
};
