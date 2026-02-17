/**
 * BottlePlanController
 *
 * Manages bottle plan creation and listing for bars.
 */

module.exports = {

  /**
   * POST /api/v1/bottle-plans
   * Create a new bottle plan (admin only, for their bar).
   */
  create: async function (req, res) {
    try {
      const { brandName, category, totalMl, price } = req.body;

      if (!brandName || !totalMl || !price) {
        return res.status(400).json({
          success: false,
          message: 'Brand name, total ml, and price are required.',
        });
      }

      if (!req.user.barId) {
        return res.status(400).json({
          success: false,
          message: 'You must be associated with a bar to create bottle plans.',
        });
      }

      const plan = await BottlePlan.create({
        brandName,
        category: category || 'other',
        totalMl: parseInt(totalMl),
        price: parseFloat(price),
        bar: req.user.barId,
      }).fetch();

      return res.status(201).json({
        success: true,
        message: 'Bottle plan created successfully.',
        data: { bottlePlan: plan },
      });
    } catch (err) {
      sails.log.error('BottlePlanController.create error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/bottle-plans
   * List bottle plans. Admins see their bar's plans. Customers can filter by bar.
   */
  list: async function (req, res) {
    try {
      const criteria = { isActive: true };

      if (req.user.role === 'admin' || req.user.role === 'staff') {
        criteria.bar = req.user.barId;
      } else if (req.query.barId) {
        criteria.bar = parseInt(req.query.barId);
      }

      const plans = await BottlePlan.find(criteria)
        .populate('bar')
        .sort('brandName ASC');

      return res.json({
        success: true,
        data: { bottlePlans: plans },
      });
    } catch (err) {
      sails.log.error('BottlePlanController.list error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/bottle-plans/:id
   * Get a specific bottle plan.
   */
  findOne: async function (req, res) {
    try {
      const plan = await BottlePlan.findOne({ id: req.params.id })
        .populate('bar');

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Bottle plan not found.',
        });
      }

      return res.json({
        success: true,
        data: { bottlePlan: plan },
      });
    } catch (err) {
      sails.log.error('BottlePlanController.findOne error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * PUT /api/v1/bottle-plans/:id
   * Update a bottle plan (admin of the bar only).
   */
  update: async function (req, res) {
    try {
      const plan = await BottlePlan.findOne({ id: req.params.id });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Bottle plan not found.',
        });
      }

      if (plan.bar !== req.user.barId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own bar\'s plans.',
        });
      }

      const { brandName, category, totalMl, price, isActive } = req.body;
      const updates = {};
      if (brandName !== undefined) updates.brandName = brandName;
      if (category !== undefined) updates.category = category;
      if (totalMl !== undefined) updates.totalMl = parseInt(totalMl);
      if (price !== undefined) updates.price = parseFloat(price);
      if (isActive !== undefined) updates.isActive = isActive;

      const updated = await BottlePlan.updateOne({ id: plan.id }).set(updates);

      return res.json({
        success: true,
        message: 'Bottle plan updated successfully.',
        data: { bottlePlan: updated },
      });
    } catch (err) {
      sails.log.error('BottlePlanController.update error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

};
