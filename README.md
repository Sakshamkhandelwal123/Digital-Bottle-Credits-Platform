# Digital Bottle Credits Platform — Backend API

A digital prepaid alcohol credit system for bars and lounges. Customers prepay for bottles at bottle-level pricing and consume them gradually over multiple visits using ml-based digital credits, redeemed securely via QR codes.

## Tech Stack

- **Framework**: Sails.js (Node.js MVC)
- **MySQL**: Relational data — Users, Bars, BottlePlans, Wallets, QrTokens
- **MongoDB**: Append-only transaction ledger
- **Auth**: JWT (JSON Web Tokens) with bcrypt password hashing
- **QR**: UUID-based single-use tokens with 2-minute expiry
- **Docs**: Swagger UI (OpenAPI 3.0) at `/api-docs`

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │     │  Bar Staff   │     │  Bar Admin   │
│   (Mobile)   │     │   (Tablet)   │     │  (Dashboard) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Sails.js API  │
                    │  (Port 1337)   │
                    └───────┬────────┘
                            │
               ┌────────────┼────────────┐
               │                         │
        ┌──────▼──────┐          ┌───────▼──────┐
        │    MySQL     │          │   MongoDB    │
        │  (Users,     │          │ (Transaction │
        │   Wallets,   │          │   Ledger)    │
        │   QR Tokens) │          │              │
        └─────────────┘          └──────────────┘
```

## Prerequisites

- **Node.js** >= 16.x
- **MySQL** >= 8.0
- **MongoDB** >= 6.0
- **npm** >= 8.x

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd Digital-Bottle-Credits-Platform
npm install
```

### 2. Set up databases

**MySQL:**
```sql
CREATE DATABASE bottle_credits;
```

**MongoDB:**
MongoDB will create the database automatically on first write.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Or update `config/datastores.js` directly.

### 4. Start the server

```bash
node app.js
# or
npx sails lift
```

The API will be available at `http://localhost:1337`.

### 5. Seed data

On first boot, the app auto-seeds sample data:

| Role     | Phone        | Password     |
|----------|-------------|--------------|
| Admin    | 9000000001  | admin123     |
| Staff    | 9000000002  | staff123     |
| Customer | 9000000003  | customer123  |

---

## Swagger / API Docs

Once the server is running, open the interactive API docs:

- **Swagger UI**: [http://localhost:1337/api-docs](http://localhost:1337/api-docs)
- **OpenAPI JSON**: [http://localhost:1337/api-docs.json](http://localhost:1337/api-docs.json)

You can authorize requests directly in Swagger UI by clicking the "Authorize" button and pasting your JWT token.

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

All protected routes require a `Authorization: Bearer <token>` header.

#### `POST /api/v1/auth/signup`
Register a new customer account.

```json
{
  "phone": "9876543210",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "mypassword"
}
```

#### `POST /api/v1/auth/login`
Login and receive JWT token.

```json
{
  "phone": "9000000001",
  "password": "admin123"
}
```

#### `GET /api/v1/auth/me`
Get current user profile. **Requires auth.**

#### `POST /api/v1/auth/create-staff`
Create staff/admin user for a bar. **Admin only.**

```json
{
  "phone": "9000000099",
  "name": "New Staff",
  "password": "staffpass",
  "role": "staff"
}
```

---

### Bars

#### `POST /api/v1/bars` — Create bar (Admin)
#### `GET /api/v1/bars` — List all active bars (Public)
#### `GET /api/v1/bars/:id` — Get bar details with plans (Public)
#### `PUT /api/v1/bars/:id` — Update bar (Admin, own bar)

---

### Bottle Plans

#### `POST /api/v1/bottle-plans` — Create plan (Admin)

```json
{
  "brandName": "Johnnie Walker Black Label",
  "category": "whisky",
  "totalMl": 750,
  "price": 4500
}
```

#### `GET /api/v1/bottle-plans` — List plans (Auth)
Query params: `?barId=1`

#### `GET /api/v1/bottle-plans/:id` — Get plan details (Auth)
#### `PUT /api/v1/bottle-plans/:id` — Update plan (Admin)

---

### Wallets

#### `POST /api/v1/wallets` — Assign bottle to customer (Admin)

```json
{
  "customerId": 3,
  "bottlePlanId": 1
}
```

Creates a wallet with full credits and logs a CREDIT transaction.

#### `GET /api/v1/wallets` — List wallets (Auth)
- Customers see their own wallets
- Admin/Staff see all wallets for their bar
- Query params: `?status=active`

#### `GET /api/v1/wallets/:id` — Get wallet details (Auth)
#### `GET /api/v1/wallets/:id/transactions` — Wallet transaction history (Auth)

---

### QR Codes & Redemption

#### `POST /api/v1/wallets/:walletId/qr` — Generate QR code (Customer)

Returns a QR code data URL and token. Token expires in 2 minutes. Generating a new QR invalidates all previous ones.

#### `POST /api/v1/qr/validate` — Validate QR token (Staff)

```json
{
  "token": "uuid-token-from-qr"
}
```

Returns wallet info if valid. Does NOT redeem.

#### `POST /api/v1/redeem` — Redeem credits (Staff)

```json
{
  "token": "uuid-token-from-qr",
  "pegSize": 60
}
```

Allowed peg sizes: `30`, `60`, `90` ml.

**Redemption rules:**
- Token must be valid and unexpired (2-min window)
- Token is single-use — invalidated immediately
- Wallet must have sufficient credits
- Wallet bar must match staff's bar
- Transaction is logged in MongoDB

---

### Admin Dashboard

All admin routes require `admin` role.

#### `GET /api/v1/admin/dashboard` — Overview stats
Returns total wallets, credits issued/redeemed/remaining, staff count, customer count, recent transactions.

#### `GET /api/v1/admin/transactions` — Transaction ledger
Query params: `?type=DEBIT&staffId=2&userId=3&page=1&limit=50`

#### `GET /api/v1/admin/staff-activity` — Staff redemption stats
#### `GET /api/v1/admin/customers` — Customer list with wallet summary
#### `GET /api/v1/admin/sales` — Revenue and sales by brand

---

### Health Check

#### `GET /api/v1/health` — API health check (Public)

---

## Data Models

### MySQL Tables

| Model       | Key Fields                                           |
|-------------|------------------------------------------------------|
| User        | phone, name, email, password, role, barId            |
| Bar         | name, address, city, phone, licenseNumber, isActive  |
| BottlePlan  | brandName, category, totalMl, price, bar, isActive   |
| Wallet      | brandName, totalCredits, remainingCredits, status, owner, bar, bottlePlan |
| QrToken     | token (UUID), expiresAt, used, wallet                |

### MongoDB Collection

| Model       | Key Fields                                           |
|-------------|------------------------------------------------------|
| Transaction | walletId, userId, staffId, barId, type, amount, pegSize, brandName, balanceBefore, balanceAfter |

---

## Core Business Rules

1. **1 ml = 1 credit** (750ml bottle = 750 credits)
2. Credits are locked to a specific bar and brand
3. Redemption only in fixed peg sizes: 30 / 60 / 90 ml
4. Credits cannot go negative or be transferred
5. QR tokens are single-use and expire after 2 minutes
6. Every redemption is logged with time, peg size, and staff ID
7. Credits from different bottles are never merged

## User Roles

| Role     | Can Do                                                    |
|----------|-----------------------------------------------------------|
| Customer | View wallets, see balances, generate QR codes, view history |
| Staff    | Scan QR, validate tokens, redeem credits                   |
| Admin    | Create plans, assign bottles, manage staff, view dashboard  |

## Project Structure

```
├── api/
│   ├── controllers/
│   │   ├── AdminController.js       # Dashboard & reporting APIs
│   │   ├── AuthController.js        # Signup, login, JWT
│   │   ├── BarController.js         # Bar CRUD
│   │   ├── BottlePlanController.js  # Bottle plan management
│   │   ├── QrTokenController.js     # QR generation & validation
│   │   ├── RedemptionController.js  # Credit redemption flow
│   │   └── WalletController.js      # Wallet management
│   ├── helpers/
│   │   ├── cleanup-expired-tokens.js
│   │   └── generate-jwt.js
│   ├── models/
│   │   ├── Bar.js                   # MySQL
│   │   ├── BottlePlan.js            # MySQL
│   │   ├── QrToken.js               # MySQL
│   │   ├── Transaction.js           # MongoDB
│   │   ├── User.js                  # MySQL
│   │   └── Wallet.js                # MySQL
│   └── policies/
│       ├── isAdmin.js
│       ├── isAdminOrStaff.js
│       ├── isAuthenticated.js
│       ├── isCustomer.js
│       └── isStaff.js
├── config/
│   ├── blueprints.js
│   ├── bootstrap.js                 # Auto-seeds dev data
│   ├── custom.js                    # JWT config, peg sizes
│   ├── datastores.js                # MySQL + MongoDB config
│   ├── models.js
│   ├── policies.js                  # Route → policy mapping
│   ├── routes.js                    # All API routes
│   └── security.js                  # CORS config
├── .env.example
├── package.json
└── app.js
```

## License

Private — All rights reserved.
