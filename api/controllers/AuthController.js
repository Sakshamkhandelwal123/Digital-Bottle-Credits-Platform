/**
 * AuthController
 *
 * Handles user registration, login, and profile retrieval.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {

  /**
   * POST /api/v1/auth/signup
   * Register a new customer account.
   */
  signup: async function (req, res) {
    try {
      const { phone, name, email, password } = req.body;

      if (!phone || !name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone, name, and password are required.',
        });
      }

      const existing = await User.findOne({ phone });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A user with this phone number already exists.',
        });
      }

      const user = await User.create({
        phone,
        name,
        email: email || null,
        password,
        role: 'customer',
      }).fetch();

      const token = jwt.sign(
        { id: user.id, role: user.role },
        sails.config.custom.jwtSecret,
        { expiresIn: sails.config.custom.jwtExpiresIn }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: _.omit(user, ['password']),
          token,
        },
      });
    } catch (err) {
      sails.log.error('AuthController.signup error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during registration.',
      });
    }
  },

  /**
   * POST /api/v1/auth/login
   * Authenticate user and return JWT token.
   */
  login: async function (req, res) {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone and password are required.',
        });
      }

      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password.',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password.',
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        sails.config.custom.jwtSecret,
        { expiresIn: sails.config.custom.jwtExpiresIn }
      );

      return res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: _.omit(user, ['password']),
          token,
        },
      });
    } catch (err) {
      sails.log.error('AuthController.login error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred during login.',
      });
    }
  },

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user's profile.
   */
  me: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id });
      return res.json({
        success: true,
        data: { user: _.omit(user, ['password']) },
      });
    } catch (err) {
      sails.log.error('AuthController.me error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

  /**
   * POST /api/v1/auth/create-staff
   * Admin creates a staff or admin user for their bar.
   */
  createStaff: async function (req, res) {
    try {
      const { phone, name, email, password, role } = req.body;

      if (!phone || !name || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone, name, and password are required.',
        });
      }

      if (role && !['staff', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be either "staff" or "admin".',
        });
      }

      const existing = await User.findOne({ phone });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A user with this phone number already exists.',
        });
      }

      const user = await User.create({
        phone,
        name,
        email: email || null,
        password,
        role: role || 'staff',
        barId: req.user.barId,
      }).fetch();

      return res.status(201).json({
        success: true,
        message: `${user.role} account created successfully.`,
        data: { user: _.omit(user, ['password']) },
      });
    } catch (err) {
      sails.log.error('AuthController.createStaff error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred.',
      });
    }
  },

};
