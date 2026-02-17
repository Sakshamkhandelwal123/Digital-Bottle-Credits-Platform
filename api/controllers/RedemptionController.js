/**
 * RedemptionController
 *
 * Handles the core redemption flow:
 * Staff scans QR -> selects peg size -> credits deducted -> transaction logged.
 */

module.exports = {

  /**
   * POST /api/v1/redeem
   * Redeem credits from a wallet using a valid QR token.
   * Only staff can perform this. Peg sizes: 30, 60, or 90 ml.
   */
  redeem: async function (req, res) {
    try {
      const { token, pegSize } = req.body;

      // Validate input
      if (!token || !pegSize) {
        return res.status(400).json({
          success: false,
          message: 'Token and peg size are required.',
        });
      }

      const allowedPegSizes = sails.config.custom.allowedPegSizes;
      const pegSizeNum = parseInt(pegSize);

      if (!allowedPegSizes.includes(pegSizeNum)) {
        return res.status(400).json({
          success: false,
          message: `Invalid peg size. Allowed sizes: ${allowedPegSizes.join(', ')} ml.`,
        });
      }

      // Find and validate the QR token
      const qrToken = await QrToken.findOne({ token, used: false });

      if (!qrToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or already used QR token.',
        });
      }

      if (qrToken.expiresAt < Date.now()) {
        // Mark expired token as used
        await QrToken.updateOne({ id: qrToken.id }).set({ used: true });
        return res.status(400).json({
          success: false,
          message: 'QR token has expired. Customer must generate a new one.',
        });
      }

      // Find the wallet
      const wallet = await Wallet.findOne({ id: qrToken.wallet });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found.',
        });
      }

      // Verify wallet belongs to staff's bar
      if (wallet.bar !== req.user.barId) {
        return res.status(403).json({
          success: false,
          message: 'This wallet does not belong to your bar.',
        });
      }

      // Check wallet status
      if (wallet.status === 'exhausted') {
        return res.status(400).json({
          success: false,
          message: 'This wallet has been exhausted.',
        });
      }

      // Check sufficient credits
      if (wallet.remainingCredits < pegSizeNum) {
        return res.status(400).json({
          success: false,
          message: `Insufficient credits. Available: ${wallet.remainingCredits} ml. Requested: ${pegSizeNum} ml.`,
        });
      }

      // Perform the redemption atomically
      const balanceBefore = wallet.remainingCredits;
      const balanceAfter = balanceBefore - pegSizeNum;
      const newStatus = balanceAfter === 0 ? 'exhausted' : 'active';

      // Invalidate the QR token immediately (prevent double scan)
      await QrToken.updateOne({ id: qrToken.id }).set({ used: true });

      // Update wallet balance
      await Wallet.updateOne({ id: wallet.id }).set({
        remainingCredits: balanceAfter,
        status: newStatus,
      });

      // Log the transaction in MongoDB
      const transaction = await Transaction.create({
        walletId: wallet.id,
        userId: wallet.owner,
        staffId: req.user.id,
        barId: wallet.bar,
        type: 'DEBIT',
        amount: pegSizeNum,
        pegSize: pegSizeNum,
        brandName: wallet.brandName,
        balanceBefore,
        balanceAfter,
        note: `Redeemed ${pegSizeNum}ml peg of ${wallet.brandName}`,
      }).fetch();

      return res.json({
        success: true,
        message: `Successfully redeemed ${pegSizeNum}ml of ${wallet.brandName}.`,
        data: {
          redemption: {
            transactionId: transaction.id,
            brandName: wallet.brandName,
            pegSize: pegSizeNum,
            creditsDeducted: pegSizeNum,
            balanceBefore,
            balanceAfter,
            walletStatus: newStatus,
            staffId: req.user.id,
            staffName: req.user.name,
            timestamp: transaction.createdAt,
          },
        },
      });
    } catch (err) {
      sails.log.error('RedemptionController.redeem error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during redemption.',
      });
    }
  },

};
