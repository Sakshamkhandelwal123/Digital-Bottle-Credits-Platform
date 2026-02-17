/**
 * Swagger / OpenAPI 3.0 Specification
 * Digital Bottle Credits Platform
 *
 * Served at GET /api-docs
 */

module.exports.swagger = {

  openapi: '3.0.3',

  info: {
    title: 'Digital Bottle Credits Platform API',
    version: '1.0.0',
    description:
      'A digital prepaid alcohol credit system for bars and lounges. Customers prepay for bottles at bottle-level pricing and consume them gradually over multiple visits using ml-based digital credits, redeemed securely via QR codes.\n\n' +
      '**Core rules:**\n' +
      '- 1 ml = 1 credit (750 ml bottle = 750 credits)\n' +
      '- Credits locked to a specific bar and brand\n' +
      '- Redemption only in peg sizes: 30 / 60 / 90 ml\n' +
      '- QR tokens are single-use, expire in 2 minutes\n' +
      '- All transactions are immutable (append-only ledger in MongoDB)',
    contact: {
      name: 'Digital Bottle Credits',
    },
    license: {
      name: 'Private',
    },
  },

  servers: [
    {
      url: 'http://localhost:1337',
      description: 'Local development server',
    },
  ],

  tags: [
    { name: 'Auth', description: 'Authentication — signup, login, profile' },
    { name: 'Bars', description: 'Bar / lounge management' },
    { name: 'Bottle Plans', description: 'Bottle plan creation and listing' },
    { name: 'Wallets', description: 'Customer wallets — one per bottle purchase' },
    { name: 'QR & Redemption', description: 'QR code generation, validation, and credit redemption' },
    { name: 'Admin', description: 'Admin dashboard — stats, transactions, staff activity, sales' },
    { name: 'Health', description: 'API health check' },
  ],

  // ──────────────────────────────────────────────
  //  PATHS
  // ──────────────────────────────────────────────
  paths: {

    // =================== HEALTH ===================
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns API status. No auth required.',
        responses: {
          200: {
            description: 'API is running',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
          },
        },
      },
    },

    // =================== AUTH ===================
    '/api/v1/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupRequest' },
              example: { phone: '9876543210', name: 'Rahul Sharma', email: 'rahul@example.com', password: 'mypassword' },
            },
          },
        },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Validation error' },
          409: { description: 'Phone already registered' },
        },
      },
    },

    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: { phone: '9000000001', password: 'admin123' },
            },
          },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },

    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfileResponse' } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },

    '/api/v1/auth/create-staff': {
      post: {
        tags: ['Auth'],
        summary: 'Create a staff or admin user (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateStaffRequest' },
              example: { phone: '9000000099', name: 'New Bartender', password: 'staffpass', role: 'staff' },
            },
          },
        },
        responses: {
          201: { description: 'Staff account created' },
          400: { description: 'Validation error' },
          403: { description: 'Admin role required' },
          409: { description: 'Phone already registered' },
        },
      },
    },

    // =================== BARS ===================
    '/api/v1/bars': {
      get: {
        tags: ['Bars'],
        summary: 'List all active bars',
        description: 'Public endpoint — no auth required.',
        responses: {
          200: { description: 'List of bars', content: { 'application/json': { schema: { $ref: '#/components/schemas/BarListResponse' } } } },
        },
      },
      post: {
        tags: ['Bars'],
        summary: 'Create a new bar (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBarRequest' },
              example: { name: 'The Tipsy Oak', address: '42 MG Road', city: 'Bangalore', phone: '9876543210', licenseNumber: 'LIC-001' },
            },
          },
        },
        responses: {
          201: { description: 'Bar created' },
          400: { description: 'Validation error' },
          403: { description: 'Admin role required' },
        },
      },
    },

    '/api/v1/bars/{id}': {
      get: {
        tags: ['Bars'],
        summary: 'Get bar details with active bottle plans',
        description: 'Public endpoint — no auth required.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Bar details' },
          404: { description: 'Bar not found' },
        },
      },
      put: {
        tags: ['Bars'],
        summary: 'Update bar details (Admin, own bar only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBarRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Bar updated' },
          403: { description: 'Can only update own bar' },
          404: { description: 'Bar not found' },
        },
      },
    },

    // =================== BOTTLE PLANS ===================
    '/api/v1/bottle-plans': {
      get: {
        tags: ['Bottle Plans'],
        summary: 'List bottle plans',
        description: 'Admins/staff see their bar\'s plans. Customers can filter by `barId`.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'barId', in: 'query', schema: { type: 'integer' }, description: 'Filter by bar (for customers)' },
        ],
        responses: {
          200: { description: 'List of bottle plans', content: { 'application/json': { schema: { $ref: '#/components/schemas/BottlePlanListResponse' } } } },
        },
      },
      post: {
        tags: ['Bottle Plans'],
        summary: 'Create a new bottle plan (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBottlePlanRequest' },
              example: { brandName: 'Johnnie Walker Black Label', category: 'whisky', totalMl: 750, price: 4500 },
            },
          },
        },
        responses: {
          201: { description: 'Bottle plan created' },
          400: { description: 'Validation error' },
          403: { description: 'Admin role required' },
        },
      },
    },

    '/api/v1/bottle-plans/{id}': {
      get: {
        tags: ['Bottle Plans'],
        summary: 'Get a specific bottle plan',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Bottle plan details' },
          404: { description: 'Not found' },
        },
      },
      put: {
        tags: ['Bottle Plans'],
        summary: 'Update a bottle plan (Admin, own bar only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBottlePlanRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Plan updated' },
          403: { description: 'Can only update own bar\'s plans' },
          404: { description: 'Not found' },
        },
      },
    },

    // =================== WALLETS ===================
    '/api/v1/wallets': {
      get: {
        tags: ['Wallets'],
        summary: 'List wallets',
        description: 'Customers see their own wallets. Admins/staff see all wallets for their bar.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'exhausted'] }, description: 'Filter by wallet status' },
        ],
        responses: {
          200: { description: 'List of wallets', content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletListResponse' } } } },
        },
      },
      post: {
        tags: ['Wallets'],
        summary: 'Assign a bottle to a customer (Admin only)',
        description: 'Creates a wallet with full credits and logs a CREDIT transaction in MongoDB.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateWalletRequest' },
              example: { customerId: 3, bottlePlanId: 1 },
            },
          },
        },
        responses: {
          201: { description: 'Wallet created with credits' },
          400: { description: 'Validation error' },
          403: { description: 'Admin role required / plan not from your bar' },
          404: { description: 'Customer or plan not found' },
        },
      },
    },

    '/api/v1/wallets/{id}': {
      get: {
        tags: ['Wallets'],
        summary: 'Get wallet details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Wallet details with populated owner, bar, plan' },
          403: { description: 'Access denied' },
          404: { description: 'Wallet not found' },
        },
      },
    },

    '/api/v1/wallets/{id}/transactions': {
      get: {
        tags: ['Wallets'],
        summary: 'Get transaction history for a wallet',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Transaction list', content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletTransactionsResponse' } } } },
          403: { description: 'Access denied' },
          404: { description: 'Wallet not found' },
        },
      },
    },

    // =================== QR & REDEMPTION ===================
    '/api/v1/wallets/{walletId}/qr': {
      post: {
        tags: ['QR & Redemption'],
        summary: 'Generate a QR code for a wallet (Customer only)',
        description: 'Generates a single-use QR token valid for 2 minutes. Invalidates all previous unused tokens for this wallet.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'walletId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'QR code generated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/QrGenerateResponse' } } },
          },
          400: { description: 'Wallet exhausted or no credits' },
          403: { description: 'Customer role required' },
          404: { description: 'Wallet not found or not owned by you' },
        },
      },
    },

    '/api/v1/qr/validate': {
      post: {
        tags: ['QR & Redemption'],
        summary: 'Validate a QR token (Staff only)',
        description: 'Checks if the token is valid and returns wallet info. Does NOT redeem credits.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/QrValidateRequest' },
              example: { token: '550e8400-e29b-41d4-a716-446655440000' },
            },
          },
        },
        responses: {
          200: { description: 'Token is valid', content: { 'application/json': { schema: { $ref: '#/components/schemas/QrValidateResponse' } } } },
          400: { description: 'Token expired or already used' },
          403: { description: 'Staff role required / wallet not from your bar' },
          404: { description: 'Invalid token' },
        },
      },
    },

    '/api/v1/redeem': {
      post: {
        tags: ['QR & Redemption'],
        summary: 'Redeem credits from a wallet (Staff only)',
        description:
          'The core redemption endpoint. Staff scans QR, selects peg size, credits are deducted, and a DEBIT transaction is logged.\n\n' +
          '**Rules:**\n' +
          '- Peg sizes: 30, 60, or 90 ml only\n' +
          '- Token must be valid and unexpired (2 min window)\n' +
          '- Token is invalidated immediately (prevents double scan)\n' +
          '- Wallet must have sufficient credits\n' +
          '- Wallet bar must match staff\'s bar',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RedeemRequest' },
              example: { token: '550e8400-e29b-41d4-a716-446655440000', pegSize: 60 },
            },
          },
        },
        responses: {
          200: {
            description: 'Credits redeemed successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RedeemResponse' } } },
          },
          400: { description: 'Invalid/expired token, invalid peg size, or insufficient credits' },
          403: { description: 'Staff role required / wallet not from your bar' },
        },
      },
    },

    // =================== ADMIN ===================
    '/api/v1/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard overview stats',
        description: 'Returns aggregated stats: wallets, credits issued/redeemed/remaining, staff count, unique customers, and recent transactions.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Dashboard data', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardResponse' } } } },
          403: { description: 'Admin role required' },
        },
      },
    },

    '/api/v1/admin/transactions': {
      get: {
        tags: ['Admin'],
        summary: 'Transaction ledger with filters',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['CREDIT', 'DEBIT'] } },
          { name: 'staffId', in: 'query', schema: { type: 'integer' } },
          { name: 'userId', in: 'query', schema: { type: 'integer' } },
          { name: 'walletId', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'Paginated transaction list' },
          403: { description: 'Admin role required' },
        },
      },
    },

    '/api/v1/admin/staff-activity': {
      get: {
        tags: ['Admin'],
        summary: 'Staff redemption activity',
        description: 'Shows total redemptions and ml redeemed per staff member.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Staff activity list' },
          403: { description: 'Admin role required' },
        },
      },
    },

    '/api/v1/admin/customers': {
      get: {
        tags: ['Admin'],
        summary: 'Customer list with wallet summaries',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Customer list grouped with their wallets' },
          403: { description: 'Admin role required' },
        },
      },
    },

    '/api/v1/admin/sales': {
      get: {
        tags: ['Admin'],
        summary: 'Sales and revenue report',
        description: 'Total revenue, bottles sold, and breakdown by brand.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Sales report', content: { 'application/json': { schema: { $ref: '#/components/schemas/SalesResponse' } } } },
          403: { description: 'Admin role required' },
        },
      },
    },

  },

  // ──────────────────────────────────────────────
  //  COMPONENTS
  // ──────────────────────────────────────────────
  components: {

    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT token obtained from /api/v1/auth/login',
      },
    },

    schemas: {

      // ---- Auth ----
      SignupRequest: {
        type: 'object',
        required: ['phone', 'name', 'password'],
        properties: {
          phone: { type: 'string', example: '9876543210' },
          name: { type: 'string', example: 'Rahul Sharma' },
          email: { type: 'string', format: 'email', example: 'rahul@example.com' },
          password: { type: 'string', minLength: 6, example: 'mypassword' },
        },
      },

      LoginRequest: {
        type: 'object',
        required: ['phone', 'password'],
        properties: {
          phone: { type: 'string', example: '9000000001' },
          password: { type: 'string', example: 'admin123' },
        },
      },

      CreateStaffRequest: {
        type: 'object',
        required: ['phone', 'name', 'password'],
        properties: {
          phone: { type: 'string', example: '9000000099' },
          name: { type: 'string', example: 'New Bartender' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', example: 'staffpass' },
          role: { type: 'string', enum: ['staff', 'admin'], default: 'staff' },
        },
      },

      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          phone: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['customer', 'staff', 'admin'] },
          barId: { type: 'integer', nullable: true },
          createdAt: { type: 'number' },
          updatedAt: { type: 'number' },
        },
      },

      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            },
          },
        },
      },

      UserProfileResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },

      // ---- Bar ----
      CreateBarRequest: {
        type: 'object',
        required: ['name', 'address', 'city'],
        properties: {
          name: { type: 'string', example: 'The Tipsy Oak' },
          address: { type: 'string', example: '42 MG Road, Indiranagar' },
          city: { type: 'string', example: 'Bangalore' },
          phone: { type: 'string', example: '9876543210' },
          licenseNumber: { type: 'string', example: 'LIC-BLR-2024-001' },
        },
      },

      UpdateBarRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          phone: { type: 'string' },
          licenseNumber: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },

      Bar: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          phone: { type: 'string', nullable: true },
          licenseNumber: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          createdAt: { type: 'number' },
          updatedAt: { type: 'number' },
        },
      },

      BarListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              bars: { type: 'array', items: { $ref: '#/components/schemas/Bar' } },
            },
          },
        },
      },

      // ---- Bottle Plan ----
      CreateBottlePlanRequest: {
        type: 'object',
        required: ['brandName', 'totalMl', 'price'],
        properties: {
          brandName: { type: 'string', example: 'Johnnie Walker Black Label' },
          category: { type: 'string', enum: ['whisky', 'vodka', 'rum', 'gin', 'tequila', 'wine', 'beer', 'other'], default: 'other' },
          totalMl: { type: 'integer', example: 750, description: 'Total ml in the bottle' },
          price: { type: 'number', example: 4500, description: 'Price in currency units' },
        },
      },

      UpdateBottlePlanRequest: {
        type: 'object',
        properties: {
          brandName: { type: 'string' },
          category: { type: 'string', enum: ['whisky', 'vodka', 'rum', 'gin', 'tequila', 'wine', 'beer', 'other'] },
          totalMl: { type: 'integer' },
          price: { type: 'number' },
          isActive: { type: 'boolean' },
        },
      },

      BottlePlan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          brandName: { type: 'string' },
          category: { type: 'string' },
          totalMl: { type: 'integer' },
          price: { type: 'number' },
          isActive: { type: 'boolean' },
          bar: { type: 'integer', description: 'Bar ID' },
          createdAt: { type: 'number' },
          updatedAt: { type: 'number' },
        },
      },

      BottlePlanListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              bottlePlans: { type: 'array', items: { $ref: '#/components/schemas/BottlePlan' } },
            },
          },
        },
      },

      // ---- Wallet ----
      CreateWalletRequest: {
        type: 'object',
        required: ['customerId', 'bottlePlanId'],
        properties: {
          customerId: { type: 'integer', example: 3, description: 'ID of the customer' },
          bottlePlanId: { type: 'integer', example: 1, description: 'ID of the bottle plan' },
        },
      },

      Wallet: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          brandName: { type: 'string' },
          totalCredits: { type: 'integer', description: '= total ml of the bottle' },
          remainingCredits: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'exhausted'] },
          owner: { type: 'integer', description: 'Customer user ID' },
          bar: { type: 'integer', description: 'Bar ID' },
          bottlePlan: { type: 'integer', description: 'Bottle plan ID' },
          createdAt: { type: 'number' },
          updatedAt: { type: 'number' },
        },
      },

      WalletListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              wallets: { type: 'array', items: { $ref: '#/components/schemas/Wallet' } },
            },
          },
        },
      },

      // ---- Transaction ----
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'MongoDB ObjectId' },
          walletId: { type: 'integer' },
          userId: { type: 'integer', description: 'Customer ID' },
          staffId: { type: 'integer', nullable: true, description: 'Staff who performed redemption' },
          barId: { type: 'integer' },
          type: { type: 'string', enum: ['CREDIT', 'DEBIT'] },
          amount: { type: 'integer', description: 'Credits amount' },
          pegSize: { type: 'integer', nullable: true, description: 'Peg size in ml (30/60/90), null for CREDIT' },
          brandName: { type: 'string' },
          balanceBefore: { type: 'integer' },
          balanceAfter: { type: 'integer' },
          note: { type: 'string' },
          createdAt: { type: 'number' },
        },
      },

      WalletTransactionsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              walletId: { type: 'integer' },
              brandName: { type: 'string' },
              remainingCredits: { type: 'integer' },
              transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
            },
          },
        },
      },

      // ---- QR & Redemption ----
      QrGenerateResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'QR code generated. Valid for 2 minutes.' },
          data: {
            type: 'object',
            properties: {
              qrToken: {
                type: 'object',
                properties: {
                  token: { type: 'string', format: 'uuid' },
                  expiresAt: { type: 'number', description: 'Unix timestamp (ms)' },
                  walletId: { type: 'integer' },
                  brandName: { type: 'string' },
                  remainingCredits: { type: 'integer' },
                },
              },
              qrCode: { type: 'string', description: 'Base64 data URL of the QR code image' },
            },
          },
        },
      },

      QrValidateRequest: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', format: 'uuid', description: 'The UUID token from the QR code' },
        },
      },

      QrValidateResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'QR token is valid.' },
          data: {
            type: 'object',
            properties: {
              walletId: { type: 'integer' },
              brandName: { type: 'string', example: 'Johnnie Walker Black Label' },
              remainingCredits: { type: 'integer', example: 690 },
              totalCredits: { type: 'integer', example: 750 },
              token: { type: 'string', format: 'uuid' },
            },
          },
        },
      },

      RedeemRequest: {
        type: 'object',
        required: ['token', 'pegSize'],
        properties: {
          token: { type: 'string', format: 'uuid', description: 'QR token from the scanned code' },
          pegSize: { type: 'integer', enum: [30, 60, 90], description: 'Peg size in ml' },
        },
      },

      RedeemResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Successfully redeemed 60ml of Johnnie Walker Black Label.' },
          data: {
            type: 'object',
            properties: {
              redemption: {
                type: 'object',
                properties: {
                  transactionId: { type: 'string' },
                  brandName: { type: 'string', example: 'Johnnie Walker Black Label' },
                  pegSize: { type: 'integer', example: 60 },
                  creditsDeducted: { type: 'integer', example: 60 },
                  balanceBefore: { type: 'integer', example: 750 },
                  balanceAfter: { type: 'integer', example: 690 },
                  walletStatus: { type: 'string', enum: ['active', 'exhausted'] },
                  staffId: { type: 'integer' },
                  staffName: { type: 'string' },
                  timestamp: { type: 'number' },
                },
              },
            },
          },
        },
      },

      // ---- Admin ----
      DashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              bar: { type: 'integer' },
              overview: {
                type: 'object',
                properties: {
                  totalWallets: { type: 'integer', example: 15 },
                  activeWallets: { type: 'integer', example: 12 },
                  exhaustedWallets: { type: 'integer', example: 3 },
                  totalCreditsIssued: { type: 'integer', example: 11250 },
                  totalCreditsRedeemed: { type: 'integer', example: 3600 },
                  totalCreditsRemaining: { type: 'integer', example: 7650 },
                  activePlans: { type: 'integer', example: 5 },
                  staffCount: { type: 'integer', example: 3 },
                  uniqueCustomers: { type: 'integer', example: 10 },
                },
              },
              recentTransactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
            },
          },
        },
      },

      SalesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              totalRevenue: { type: 'number', example: 67500 },
              totalBottlesSold: { type: 'integer', example: 15 },
              salesByBrand: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    brandName: { type: 'string', example: 'Johnnie Walker Black Label' },
                    bottlesSold: { type: 'integer', example: 5 },
                    totalRevenue: { type: 'number', example: 22500 },
                    totalMl: { type: 'integer', example: 3750 },
                    mlRedeemed: { type: 'integer', example: 1200 },
                  },
                },
              },
            },
          },
        },
      },

      // ---- Health ----
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Digital Bottle Credits Platform API is running.' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },

      // ---- Generic Error ----
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },

    },

  },

};
