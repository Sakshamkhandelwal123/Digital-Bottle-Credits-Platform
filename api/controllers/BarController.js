/**
 * BarController
 *
 * Manages bar/lounge creation and retrieval.
 */

module.exports = {

  /**
   * POST /api/v1/bars
   * Create a new bar (admin only).
   */
  create: async function (req, res) {
    try {
      const { name, address, city, phone, licenseNumber } = req.body;

      if (!name || !address || !city) {
        return res.status(400).json({
          success: false,
          message: 'Name, address, and city are required.',
        });
      }

      const bar = await Bar.create({
        name,
        address,
        city,
        phone: phone || null,
        licenseNumber: licenseNumber || null,
      }).fetch();

      // Link the admin user to this bar
      await User.updateOne({ id: req.user.id }).set({ barId: bar.id });

      return res.status(201).json({
        success: true,
        message: 'Bar created successfully.',
        data: { bar },
      });
    } catch (err) {
      sails.log.error('BarController.create error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while creating the bar.',
      });
    }
  },

  /**
   * GET /api/v1/bars
   * List all active bars.
   */
  list: async function (req, res) {
    try {
      const bars = await Bar.find({ isActive: true })
        .sort('name ASC');

      return res.json({
        success: true,
        data: { bars },
      });
    } catch (err) {
      sails.log.error('BarController.list error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * GET /api/v1/bars/:id
   * Get bar details with its active bottle plans.
   */
  findOne: async function (req, res) {
    try {
      const bar = await Bar.findOne({ id: req.params.id })
        .populate('bottlePlans');

      if (!bar) {
        return res.status(404).json({
          success: false,
          message: 'Bar not found.',
        });
      }

      // Filter to only active bottle plans
      bar.bottlePlans = (bar.bottlePlans || []).filter(p => p.isActive);

      return res.json({
        success: true,
        data: { bar },
      });
    } catch (err) {
      sails.log.error('BarController.findOne error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * PUT /api/v1/bars/:id
   * Update bar details (admin of that bar only).
   */
  update: async function (req, res) {
    try {
      const barId = parseInt(req.params.id);

      if (req.user.barId !== barId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own bar.',
        });
      }

      const { name, address, city, phone, licenseNumber, isActive } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (city !== undefined) updates.city = city;
      if (phone !== undefined) updates.phone = phone;
      if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
      if (isActive !== undefined) updates.isActive = isActive;

      const bar = await Bar.updateOne({ id: barId }).set(updates);

      if (!bar) {
        return res.status(404).json({
          success: false,
          message: 'Bar not found.',
        });
      }

      return res.json({
        success: true,
        message: 'Bar updated successfully.',
        data: { bar },
      });
    } catch (err) {
      sails.log.error('BarController.update error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

};
