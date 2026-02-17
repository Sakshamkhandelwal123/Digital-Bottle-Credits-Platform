/**
 * Custom configuration
 * (sails.config.custom)
 */

module.exports.custom = {

  jwtSecret: process.env.JWT_SECRET || 'bottle-credits-super-secret-key-change-in-production',

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  qrTokenExpiryMinutes: 2,

  allowedPegSizes: [30, 60, 90],

};
