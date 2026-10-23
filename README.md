# Bohloko Family Farm â€“ Poultry Processing System

An integrated poultry farming, processing, and distribution management system built for Bohloko Family Farm in the Free State, South Africa.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Bootstrap 5.3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | NeDB (file-based document database) |
| Authentication | JWT (JSON Web Tokens), bcryptjs |
| Fonts | Playfair Display, Inter |
| Icons | Font Awesome 6.4 |
| Maps | Leaflet.js (contact page) |

## Project Structure

```
BohlokoFamilyFarm/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ config/          # Database & constants
â”‚   â”œâ”€â”€ data/            # NeDB .db files (auto-created)
â”‚   â”œâ”€â”€ middleware/       # Auth middleware (JWT, RBAC)
â”‚   â”œâ”€â”€ models/          # Data models (18 files)
â”‚   â”œâ”€â”€ repositories/    # Base CRUD repository
â”‚   â”œâ”€â”€ routes/          # API routes (19 files)
â”‚   â”œâ”€â”€ services/        # Business logic (16 files)
â”‚   â”œâ”€â”€ server.js        # Express entry point
â”‚   â”œâ”€â”€ seed.js          # Database seeder
â”‚   â””â”€â”€ .env             # Environment config
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ api.js           # API client with auth
â”‚   â”œâ”€â”€ admin.js         # Admin panel utilities
â”‚   â””â”€â”€ lang/            # i18n (en.json, st.json)
â”œâ”€â”€ styles/              # CSS files (7 files)
â”œâ”€â”€ Images/              # Product & logo images
â”œâ”€â”€ Documentation/       # Project docs & diagrams
â”œâ”€â”€ *.html               # 34 HTML pages
â””â”€â”€ sw.js                # Service worker (offline)
```

## User Roles

| Role | Access Level |
|------|-------------|
| **Farm Manager** | Full system access, user management, analytics, settings |
| **Poultry Attendant** | Daily logs, health checks, medications, vaccinations |
| **Processing Staff** | Processing batches, quality checks, yield records |
| **Sales Assistant** | Orders, payments, customer management |
| **Customer** | Shop, orders, profile, feedback |

## Features

### Production Management
- Production cycle planning and tracking
- Daily logging (bird counts, feed, water, mortality)
- Environmental monitoring (temperature, humidity)
- Medication and vaccination tracking
- Health check records

### Inventory Management
- Real-time stock levels
- Expiry date tracking
- Low stock alerts
- Inter-location transfers
- Batch tracking

### Order & Sales
- Product catalog with images
- Shopping cart and checkout
- Order status workflow (Pending â†’ Confirmed â†’ Processing â†’ Shipped â†’ Delivered)
- Multiple payment methods (cash, bank transfer, mobile money, credit card)
- Invoice generation

### CRM & Loyalty
- Customer profiles and segmentation
- Loyalty program with points and rewards
- Feedback and complaint management
- Promotional campaigns

### Analytics & Reporting
- Production analytics
- Sales and financial reports
- Inventory analytics
- Profit & Loss statements
- Data export (JSON)

### Compliance
- Quality control checks
- Corrective action tracking
- Compliance records and audits

### System Administration
- User management with approval workflow
- System configuration
- API key management
- Audit logging
- Data backup and restore

## Setup

### Prerequisites
- Node.js 18+ (tested with v22.16.0)
- npm
- MySQL (local development) or PostgreSQL (production, via `DATABASE_URL`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BohlokoFamilyFarm

# Install backend dependencies
cd backend
npm install

# Create your environment file and edit the values (see below)
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# Seed the database (optional)
npm run seed

# Start the server (auto-reloads with nodemon)
npm run dev
```

The server runs at `http://localhost:5000`. The same Express server also serves the frontend HTML pages, so no separate frontend install is needed. For production, use `npm start`.

### Useful npm Scripts (run from `backend/`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the server with nodemon |
| `npm start` | Start the server with node |
| `npm run seed` | Seed the database |
| `npm run seed:mysql` | Seed a MySQL database |
| `npm run seed:products` | Seed the product catalog |
| `npm run setup:mysql` | Set up the MySQL database |
| `npm run migrate` | Run Knex migrations |
| `npm run migrate:rollback` | Roll back the last migration batch |
| `npm test` | Run Jest tests |

### Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Farm Manager | admin@bohloko.co.za | Admin@123 |
| Staff | staff@bohloko.co.za | Staff@123 |
| Customer | consumer@bohloko.co.za | Consumer@123 |

Change these passwords before deploying anywhere public.

### Environment Variables (backend/.env)

Copy `backend/.env.example` to `backend/.env`. Main settings:

```env
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# JWT
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1h

# MySQL (local development)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your-password>
DB_NAME=bohloko_farm

# PostgreSQL (production)
DATABASE_URL=postgres://user:password@host:5432/database

# Google Sign-In
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com

# PayFast payments
PAYFAST_MERCHANT_ID=<id>
PAYFAST_MERCHANT_KEY=<key>
PAYFAST_PASSPHRASE=<passphrase>
PAYFAST_MODE=sandbox
PAYFAST_RETURN_URL=http://localhost:5000/pages/public/payment-success.html
PAYFAST_CANCEL_URL=http://localhost:5000/pages/public/payment-cancel.html
PAYFAST_NOTIFY_URL=http://localhost:5000/api/payfast/notify
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new account |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout (token blacklist) |
| GET | /api/auth/me | Get current user |

### Production
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/production/cycles | List/Create cycles |
| PUT | /api/production/cycles/:id | Update cycle |
| PUT | /api/production/cycles/:id/approve | Approve cycle |
| POST | /api/production/daily-logs | Create daily log |
| POST | /api/production/medications | Record medication |
| POST | /api/production/vaccinations | Record vaccination |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/orders | List/Create orders |
| GET | /api/orders/all | All orders (admin) |
| PUT | /api/orders/:id/status | Update status |
| PUT | /api/orders/:id/cancel | Cancel order |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/inventory | List/Create inventory |
| PUT | /api/inventory/:id/adjust | Adjust stock |
| PUT | /api/inventory/:id/transfer | Transfer stock |
| GET | /api/inventory/low-stock | Low stock alerts |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/payments | List/Create payments |
| PUT | /api/payments/:id/process | Process payment |
| PUT | /api/payments/:id/refund | Refund payment |

### CRM
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/crm/profile/me | My profile |
| POST | /api/crm/feedback | Submit feedback |
| POST | /api/crm/loyalty/enroll | Enroll loyalty |
| POST | /api/crm/campaigns | Create campaign |

## Security Features

- JWT token authentication with blacklist
- bcrypt password hashing (12 salt rounds)
- Role-based access control (5 roles)
- Account lockout after 5 failed attempts
- Input validation with express-validator
- CORS origin restriction
- Backend directory protection from static serving

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is proprietary to Bohloko Family Farm.
