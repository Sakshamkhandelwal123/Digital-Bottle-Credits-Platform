/**
 * Route Mappings
 * (sails.config.routes)
 *
 * All API routes for the Digital Bottle Credits Platform.
 * Prefix: /api/v1
 */

module.exports.routes = {

  // ============================================================
  // AUTH
  // ============================================================
  'POST /api/v1/auth/signup':        'AuthController.signup',
  'POST /api/v1/auth/login':         'AuthController.login',
  'GET  /api/v1/auth/me':            'AuthController.me',
  'POST /api/v1/auth/create-staff':  'AuthController.createStaff',

  // ============================================================
  // BARS
  // ============================================================
  'POST /api/v1/bars':      'BarController.create',
  'GET  /api/v1/bars':      'BarController.list',
  'GET  /api/v1/bars/:id':  'BarController.findOne',
  'PUT  /api/v1/bars/:id':  'BarController.update',

  // ============================================================
  // BOTTLE PLANS
  // ============================================================
  'POST /api/v1/bottle-plans':      'BottlePlanController.create',
  'GET  /api/v1/bottle-plans':      'BottlePlanController.list',
  'GET  /api/v1/bottle-plans/:id':  'BottlePlanController.findOne',
  'PUT  /api/v1/bottle-plans/:id':  'BottlePlanController.update',

  // ============================================================
  // WALLETS
  // ============================================================
  'POST /api/v1/wallets':                    'WalletController.create',
  'GET  /api/v1/wallets':                    'WalletController.list',
  'GET  /api/v1/wallets/:id':                'WalletController.findOne',
  'GET  /api/v1/wallets/:id/transactions':   'WalletController.transactions',

  // ============================================================
  // QR TOKENS
  // ============================================================
  'POST /api/v1/wallets/:walletId/qr':  'QrTokenController.generate',
  'POST /api/v1/qr/validate':           'QrTokenController.validate',

  // ============================================================
  // REDEMPTION
  // ============================================================
  'POST /api/v1/redeem':  'RedemptionController.redeem',

  // ============================================================
  // ADMIN DASHBOARD
  // ============================================================
  'GET /api/v1/admin/dashboard':       'AdminController.dashboard',
  'GET /api/v1/admin/transactions':    'AdminController.transactions',
  'GET /api/v1/admin/staff-activity':  'AdminController.staffActivity',
  'GET /api/v1/admin/customers':       'AdminController.customers',
  'GET /api/v1/admin/sales':           'AdminController.sales',

  // ============================================================
  // HEALTH CHECK
  // ============================================================
  'GET /api/v1/health': function (req, res) {
    return res.json({
      success: true,
      message: 'Digital Bottle Credits Platform API is running.',
      timestamp: new Date().toISOString(),
    });
  },

};
