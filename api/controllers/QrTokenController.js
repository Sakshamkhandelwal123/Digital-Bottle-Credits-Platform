/**
 * QrTokenController
 *
 * Generates single-use, time-limited QR tokens for wallet redemption.
 * Tokens expire after 2 minutes and are invalidated immediately after use.
 */

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

module.exports = {

  /**
   * POST /api/v1/wallets/:walletId/qr
   * Generate a new QR token for a wallet (customer only).
   * Invalidates any previous unused tokens for this wallet.
   */
  generate: async function (req, res) {
    try {
      const walletId = parseInt(req.params.walletId);

      // Validate wallet belongs to this customer
      const wallet = await Wallet.findOne({ id: walletId, owner: req.user.id });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found or does not belong to you.',
        });
      }

      if (wallet.status === 'exhausted') {
        return res.status(400).json({
          success: false,
          message: 'This wallet has no remaining credits.',
        });
      }

      if (wallet.remainingCredits <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits in this wallet.',
        });
      }

      // Invalidate all previous unused tokens for this wallet (prevent replay)
      await QrToken.update({ wallet: walletId, used: false }).set({ used: true });

      // Generate new token
      const token = uuidv4();
      const expiryMinutes = sails.config.custom.qrTokenExpiryMinutes;
      const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

      const qrToken = await QrToken.create({
        token,
        expiresAt,
        used: false,
        wallet: walletId,
      }).fetch();

      // Generate QR code as data URL
      const qrPayload = JSON.stringify({
        token: qrToken.token,
        walletId: walletId,
        brandName: wallet.brandName,
        remainingCredits: wallet.remainingCredits,
      });

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2,
      });

      return res.json({
        success: true,
        message: `QR code generated. Valid for ${expiryMinutes} minutes.`,
        data: {
          qrToken: {
            token: qrToken.token,
            expiresAt: qrToken.expiresAt,
            walletId: walletId,
            brandName: wallet.brandName,
            remainingCredits: wallet.remainingCredits,
          },
          qrCode: qrDataUrl,
        },
      });
    } catch (err) {
      sails.log.error('QrTokenController.generate error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating the QR code.',
      });
    }
  },

  /**
   * POST /api/v1/qr/validate
   * Validate a QR token (staff only). Returns wallet info if valid.
   * Does NOT redeem — just checks validity.
   */
  validate: async function (req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required.',
        });
      }

      const qrToken = await QrToken.findOne({ token })
        .populate('wallet');

      if (!qrToken) {
        return res.status(404).json({
          success: false,
          message: 'Invalid QR token.',
        });
      }

      if (qrToken.used) {
        return res.status(400).json({
          success: false,
          message: 'This QR token has already been used.',
        });
      }

      if (qrToken.expiresAt < Date.now()) {
        return res.status(400).json({
          success: false,
          message: 'This QR token has expired. Customer must generate a new one.',
        });
      }

      // Verify the wallet's bar matches the staff's bar
      if (qrToken.wallet.bar !== req.user.barId) {
        return res.status(403).json({
          success: false,
          message: 'This wallet does not belong to your bar.',
        });
      }

      return res.json({
        success: true,
        message: 'QR token is valid.',
        data: {
          walletId: qrToken.wallet.id,
          brandName: qrToken.wallet.brandName,
          remainingCredits: qrToken.wallet.remainingCredits,
          totalCredits: qrToken.wallet.totalCredits,
          token: qrToken.token,
        },
      });
    } catch (err) {
      sails.log.error('QrTokenController.validate error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during QR validation.',
      });
    }
  },

};
