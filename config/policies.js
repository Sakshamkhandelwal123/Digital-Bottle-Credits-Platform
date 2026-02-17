/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Maps controllers/actions to policies for role-based access control.
 */

module.exports.policies = {

  // Default: block all unless explicitly allowed
  '*': 'isAuthenticated',

  // Auth: public routes (no auth needed)
  AuthController: {
    signup: true,
    login: true,
    me: 'isAuthenticated',
    createStaff: ['isAuthenticated', 'isAdmin'],
  },

  // Bars
  BarController: {
    create: ['isAuthenticated', 'isAdmin'],
    list: true,
    findOne: true,
    update: ['isAuthenticated', 'isAdmin'],
  },

  // Bottle Plans
  BottlePlanController: {
    create: ['isAuthenticated', 'isAdmin'],
    list: 'isAuthenticated',
    findOne: 'isAuthenticated',
    update: ['isAuthenticated', 'isAdmin'],
  },

  // Wallets
  WalletController: {
    create: ['isAuthenticated', 'isAdmin'],
    list: 'isAuthenticated',
    findOne: 'isAuthenticated',
    transactions: 'isAuthenticated',
  },

  // QR Tokens
  QrTokenController: {
    generate: ['isAuthenticated', 'isCustomer'],
    validate: ['isAuthenticated', 'isAdminOrStaff'],
  },

  // Redemption
  RedemptionController: {
    redeem: ['isAuthenticated', 'isAdminOrStaff'],
  },

  // Admin Dashboard
  AdminController: {
    '*': ['isAuthenticated', 'isAdmin'],
  },

};
