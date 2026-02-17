/**
 * QrToken.js
 *
 * Single-use, time-limited QR token for wallet redemption.
 * Expires after 2 minutes. Invalidated immediately after use.
 * Stored in MySQL (default datastore).
 */

module.exports = {

  attributes: {

    token: {
      type: 'string',
      required: true,
      unique: true,
      description: 'UUID-based unique token',
    },

    expiresAt: {
      type: 'number',
      required: true,
      description: 'Unix timestamp (ms) when this token expires',
    },

    used: {
      type: 'boolean',
      defaultsTo: false,
    },

    // Associations
    wallet: {
      model: 'wallet',
      required: true,
    },

  },

};
