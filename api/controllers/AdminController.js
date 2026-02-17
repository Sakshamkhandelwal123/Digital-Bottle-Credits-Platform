/**
 * AdminController
 *
 * Dashboard APIs for bar admins to view sales, redemptions, and staff activity.
 */

module.exports = {

  /**
   * GET /api/v1/admin/dashboard
   * Get overview stats for the admin's bar.
   */
  dashboard: async function (req, res) {
    try {
      const barId = req.user.barId;

      if (!barId) {
        return res.status(400).json({
          success: false,
          message: 'You are not associated with any bar.',
        });
      }

      // Total wallets and credits
      const wallets = await Wallet.find({ bar: barId });
      const totalWallets = wallets.length;
      const activeWallets = wallets.filter(w => w.status === 'active').length;
      const exhaustedWallets = wallets.filter(w => w.status === 'exhausted').length;
      const totalCreditsIssued = wallets.reduce((sum, w) => sum + w.totalCredits, 0);
      const totalCreditsRemaining = wallets.reduce((sum, w) => sum + w.remainingCredits, 0);
      const totalCreditsRedeemed = totalCreditsIssued - totalCreditsRemaining;

      // Total bottle plans
      const bottlePlans = await BottlePlan.count({ bar: barId, isActive: true });

      // Staff count
      const staffCount = await User.count({ barId: barId, role: 'staff' });

      // Unique customers
      const uniqueCustomerIds = [...new Set(wallets.map(w => w.owner))];

      // Recent transactions from MongoDB
      const recentTransactions = await Transaction.find({ barId: barId })
        .sort('createdAt DESC')
        .limit(10);

      return res.json({
        success: true,
        data: {
          bar: barId,
          overview: {
            totalWallets,
            activeWallets,
            exhaustedWallets,
            totalCreditsIssued,
            totalCreditsRedeemed,
            totalCreditsRemaining,
            activePlans: bottlePlans,
            staffCount,
            uniqueCustomers: uniqueCustomerIds.length,
          },
          recentTransactions,
        },
      });
    } catch (err) {
      sails.log.error('AdminController.dashboard error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/admin/transactions
   * Get all transactions for the admin's bar with optional filters.
   */
  transactions: async function (req, res) {
    try {
      const barId = req.user.barId;
      const criteria = { barId };

      if (req.query.type) {
        criteria.type = req.query.type.toUpperCase();
      }
      if (req.query.staffId) {
        criteria.staffId = parseInt(req.query.staffId);
      }
      if (req.query.userId) {
        criteria.userId = parseInt(req.query.userId);
      }
      if (req.query.walletId) {
        criteria.walletId = parseInt(req.query.walletId);
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find(criteria)
        .sort('createdAt DESC')
        .skip(skip)
        .limit(limit);

      const total = await Transaction.count(criteria);

      return res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      sails.log.error('AdminController.transactions error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/admin/staff-activity
   * Get redemption activity grouped by staff member.
   */
  staffActivity: async function (req, res) {
    try {
      const barId = req.user.barId;

      // Get all staff for this bar
      const staffMembers = await User.find({ barId, role: 'staff' });

      const staffActivity = await Promise.all(
        staffMembers.map(async (staff) => {
          const redemptions = await Transaction.find({
            barId,
            staffId: staff.id,
            type: 'DEBIT',
          });

          const totalRedemptions = redemptions.length;
          const totalMlRedeemed = redemptions.reduce((sum, t) => sum + t.amount, 0);

          return {
            staffId: staff.id,
            staffName: staff.name,
            staffPhone: staff.phone,
            totalRedemptions,
            totalMlRedeemed,
            lastActive: redemptions.length > 0 ? redemptions[0].createdAt : null,
          };
        })
      );

      return res.json({
        success: true,
        data: { staffActivity },
      });
    } catch (err) {
      sails.log.error('AdminController.staffActivity error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/admin/customers
   * List all customers who have wallets at this bar.
   */
  customers: async function (req, res) {
    try {
      const barId = req.user.barId;

      const wallets = await Wallet.find({ bar: barId })
        .populate('owner');

      // Group wallets by customer
      const customerMap = {};
      wallets.forEach(wallet => {
        if (!wallet.owner) return;
        const cId = wallet.owner.id;
        if (!customerMap[cId]) {
          customerMap[cId] = {
            customerId: cId,
            name: wallet.owner.name,
            phone: wallet.owner.phone,
            wallets: [],
            totalCredits: 0,
            remainingCredits: 0,
          };
        }
        customerMap[cId].wallets.push({
          walletId: wallet.id,
          brandName: wallet.brandName,
          totalCredits: wallet.totalCredits,
          remainingCredits: wallet.remainingCredits,
          status: wallet.status,
        });
        customerMap[cId].totalCredits += wallet.totalCredits;
        customerMap[cId].remainingCredits += wallet.remainingCredits;
      });

      return res.json({
        success: true,
        data: {
          customers: Object.values(customerMap),
        },
      });
    } catch (err) {
      sails.log.error('AdminController.customers error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/admin/sales
   * Get sales summary (total revenue from bottle plans sold).
   */
  sales: async function (req, res) {
    try {
      const barId = req.user.barId;

      const wallets = await Wallet.find({ bar: barId })
        .populate('bottlePlan');

      let totalRevenue = 0;
      const salesByBrand = {};

      wallets.forEach(wallet => {
        if (wallet.bottlePlan) {
          const price = wallet.bottlePlan.price || 0;
          totalRevenue += price;

          if (!salesByBrand[wallet.brandName]) {
            salesByBrand[wallet.brandName] = {
              brandName: wallet.brandName,
              bottlesSold: 0,
              totalRevenue: 0,
              totalMl: 0,
              mlRedeemed: 0,
            };
          }
          salesByBrand[wallet.brandName].bottlesSold += 1;
          salesByBrand[wallet.brandName].totalRevenue += price;
          salesByBrand[wallet.brandName].totalMl += wallet.totalCredits;
          salesByBrand[wallet.brandName].mlRedeemed += (wallet.totalCredits - wallet.remainingCredits);
        }
      });

      return res.json({
        success: true,
        data: {
          totalRevenue,
          totalBottlesSold: wallets.length,
          salesByBrand: Object.values(salesByBrand),
        },
      });
    } catch (err) {
      sails.log.error('AdminController.sales error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

};
