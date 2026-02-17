/**
 * isAuthenticated
 *
 * Verifies JWT token from the Authorization header.
 * Attaches the decoded user to req.user.
 */

const jwt = require('jsonwebtoken');

module.exports = async function (req, res, proceed) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Missing or invalid authorization header. Use: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, sails.config.custom.jwtSecret);
    const user = await User.findOne({ id: decoded.id });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
    }

    req.user = user;
    return proceed();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
