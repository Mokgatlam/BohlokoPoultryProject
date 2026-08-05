# Bohloko Family Farm Backend API

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (already created with default values):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bohloko_farm
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

4. Start MongoDB (if running locally)

5. Seed the database with test data:
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication (FR-001, FR-002)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Production Management (FR-004 to FR-006)
- `POST /api/production/cycles` - Create production cycle
- `GET /api/production/cycles` - Get all cycles
- `PUT /api/production/cycles/:id/approve` - Approve cycle
- `POST /api/production/daily-logs` - Record daily log
- `GET /api/production/daily-logs/:cycleId` - Get logs for cycle
- `POST /api/production/medications` - Record medication
- `GET /api/production/medications/:cycleId` - Get medications

### Inventory Management (FR-007 to FR-009)
- `POST /api/inventory` - Create inventory batch
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/low-stock` - Get low stock items
- `PUT /api/inventory/:id/adjust` - Adjust inventory
- `GET /api/inventory/report` - Generate report

### Order Management (FR-010 to FR-014)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/all` - Get all orders (admin)

### User Management (FR-015, FR-016)
- `GET /api/users` - Get all users
- `PUT /api/users/:id/status` - Update user status
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/profile` - Update profile
- `GET /api/users/pending` - Get pending users
- `GET /api/users/stats` - Get user statistics

### Analytics (FR-017 to FR-019)
- `GET /api/analytics/production` - Production analytics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/inventory` - Inventory analytics
- `GET /api/analytics/dashboard` - Dashboard summary

## Test Credentials (after seeding)
- **Farm Manager**: admin@bohlokofarm.co.za / Admin@123
- **Poultry Attendant**: john@bohlokofarm.co.za / Staff@123
- **Consumer (pending)**: jane@example.com / Consumer@123
