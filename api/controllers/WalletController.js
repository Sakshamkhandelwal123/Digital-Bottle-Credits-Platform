/**
 * WalletController
 *
 * Manages wallet creation (bottle assignment) and retrieval.
 * Each wallet represents one bottle purchase tied to a customer, bar, and brand.
 */

module.exports = {

  /**
   * POST /api/v1/wallets
   * Admin assigns a bottle to a customer after payment.
   * Creates a wallet with full credits and logs a CREDIT transaction.
   */
  create: async function (req, res) {
    try {
      const { customerId, bottlePlanId } = req.body;

      if (!customerId || !bottlePlanId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID and bottle plan ID are required.',
        });
      }

      // Validate customer
      const customer = await User.findOne({ id: customerId, role: 'customer' });
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found.',
        });
      }

      // Validate bottle plan belongs to admin's bar
      const plan = await BottlePlan.findOne({ id: bottlePlanId });
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Bottle plan not found.',
        });
      }

      if (plan.bar !== req.user.barId) {
        return res.status(403).json({
          success: false,
          message: 'This bottle plan does not belong to your bar.',
        });
      }

      // Create the wallet
      const wallet = await Wallet.create({
        brandName: plan.brandName,
        totalCredits: plan.totalMl,
        remainingCredits: plan.totalMl,
        status: 'active',
        owner: customerId,
        bar: plan.bar,
        bottlePlan: plan.id,
      }).fetch();

      // Log the initial CREDIT transaction in MongoDB
      await Transaction.create({
        walletId: wallet.id,
        userId: customerId,
        staffId: req.user.id,
        barId: plan.bar,
        type: 'CREDIT',
        amount: plan.totalMl,
        pegSize: null,
        brandName: plan.brandName,
        balanceBefore: 0,
        balanceAfter: plan.totalMl,
        note: `Bottle plan purchased: ${plan.brandName} (${plan.totalMl}ml)`,
      });

      return res.status(201).json({
        success: true,
        message: `Wallet created with ${plan.totalMl} credits for ${plan.brandName}.`,
        data: { wallet },
      });
    } catch (err) {
      sails.log.error('WalletController.create error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the wallet.',
      });
    }
  },

  /**
   * GET /api/v1/wallets
   * List wallets for the current user.
   * Customers see their own wallets. Admins see all wallets for their bar.
   */
  list: async function (req, res) {
    try {
      let criteria = {};

      if (req.user.role === 'customer') {
        criteria.owner = req.user.id;
      } else if (req.user.role === 'admin' || req.user.role === 'staff') {
        criteria.bar = req.user.barId;
      }

      // Optional filters
      if (req.query.status) {
        criteria.status = req.query.status;
      }

      const wallets = await Wallet.find(criteria)
        .populate('owner')
        .populate('bar')
        .populate('bottlePlan')
        .sort('createdAt DESC');

      // Sanitize owner password
      wallets.forEach(w => {
        if (w.owner) {
          delete w.owner.password;
        }
      });

      return res.json({
        success: true,
        data: { wallets },
      });
    } catch (err) {
      sails.log.error('WalletController.list error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/wallets/:id
   * Get a specific wallet with full details.
   */
  findOne: async function (req, res) {
    try {
      const wallet = await Wallet.findOne({ id: req.params.id })
        .populate('owner')
        .populate('bar')
        .populate('bottlePlan');

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found.',
        });
      }

      // Authorization: customer can only see their own wallets
      if (req.user.role === 'customer' && wallet.owner.id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own wallets.',
        });
      }

      // Staff/admin can only see wallets for their bar
      if ((req.user.role === 'staff' || req.user.role === 'admin') && wallet.bar.id !== req.user.barId) {
        return res.status(403).json({
          success: false,
          message: 'This wallet does not belong to your bar.',
        });
      }

      // Remove password
      if (wallet.owner) {
        delete wallet.owner.password;
      }

      return res.json({
        success: true,
        data: { wallet },
      });
    } catch (err) {
      sails.log.error('WalletController.findOne error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/wallets/:id/transactions
   * Get transaction history for a specific wallet.
   */
  transactions: async function (req, res) {
    try {
      const wallet = await Wallet.findOne({ id: req.params.id });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found.',
        });
      }

      // Authorization
      if (req.user.role === 'customer' && wallet.owner !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own wallet transactions.',
        });
      }

      const transactions = await Transaction.find({ walletId: wallet.id })
        .sort('createdAt DESC');

      return res.json({
        success: true,
        data: {
          walletId: wallet.id,
          brandName: wallet.brandName,
          remainingCredits: wallet.remainingCredits,
          transactions,
        },
      });
    } catch (err) {
      sails.log.error('WalletController.transactions error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

};
