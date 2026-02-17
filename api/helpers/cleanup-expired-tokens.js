/**
 * cleanup-expired-tokens
 *
 * Marks all expired, unused QR tokens as used.
 * Can be called periodically to keep the token table clean.
 *
 * Usage: await sails.helpers.cleanupExpiredTokens();
 */

module.exports = {

  friendlyName: 'Cleanup expired tokens',

  description: 'Mark all expired QR tokens as used to prevent stale token accumulation.',

  fn: async function () {
    const now = Date.now();

    const result = await QrToken.update({
      used: false,
      expiresAt: { '<': now },
    }).set({ used: true }).fetch();

    if (result.length > 0) {
      sails.log.info(`Cleaned up ${result.length} expired QR token(s).`);
    }

    return result.length;
  },

};
