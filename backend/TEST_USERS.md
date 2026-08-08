# Test Users & Seeded Data

## Seeded Users

| # | Name | Email | Password | Type | Role | Status |
|---|------|-------|----------|------|------|--------|
| 1 | Thabo Bohloko | `admin@bohlokofarm.co.za` | `Admin@123` | Staff | Farm Manager | approved |
| 2 | John Doe | `john@bohlokofarm.co.za` | `Staff@123` | Staff | Poultry Attendant | approved |
| 3 | Sarah Mokoena | `sarah@bohlokofarm.co.za` | `Staff@123` | Staff | Production Supervisor | approved |
| 4 | Jane Smith | `jane@example.com` | `Consumer@123` | Consumer | Customer | approved |
| 5 | David Nkosi | `david@example.com` | `Consumer@123` | Consumer | Customer | approved |
| 6 | Maria Garcia | `maria@spicekitchen.co.za` | `Restaurant@123` | Restaurant | Customer | approved |
| 7 | Pieter Van Der Berg | `pieter@greenstore.co.za` | `Retailer@123` | Retailer | Customer | approved |
| 8 | Nomsa Dlamini | `nomsa@freshdistribute.co.za` | `Distributor@123` | Distributor | Customer | approved |
| 9 | Admin School | `admin@brightschool.edu.za` | `Institution@123` | Institution | Customer | approved |
| 10 | Alex Johnson | `alex@example.com` | `Pending@123` | Consumer | Customer | **pending** |

## Unit Tests

The 3 test files (`UserService.test.js`, `OrderService.test.js`, `PaymentService.test.js`) are pure unit tests — they test logic in isolation with no database or seeded users. They use:
- `process.env.JWT_SECRET || 'test-secret'` for JWT tests
- Inline mock data (no real user records)

To run tests:
```bash
cd backend && npm test
```

## Seed Commands

| Command | What it seeds |
|---------|--------------|
| `node seed.js` | NeDB (local dev) — all 10 users + full dataset |
| `node seed-mysql.js` | MySQL — all 10 users + core dataset |
| `node seed-products.js` | MySQL — 18 products with tiered pricing |
| `npx knex migrate:latest` | PostgreSQL/MySQL — creates tables (no data) |

## Seeded Data Summary

### seed.js (NeDB - Local Development)
- 10 users
- 4 production cycles (1 In Progress, 2 Completed, 1 Planned)
- 35 daily logs
- 4 medication records
- 5 health check records
- 5 vaccination records
- 5 weight records
- 13 feed records
- 35 environment records
- 8 inventory items (6 available, 1 sold, 1 expired)
- 7 orders (various statuses)
- 5 customer profiles
- 5 loyalty enrollments
- 5 feedback records
- 4 campaigns

### seed-mysql.js (MySQL)
- 10 users
- 4 production cycles
- 35 daily logs
- 6 inventory items
- 5 orders
- 5 customer profiles
- 5 loyalty enrollments
- 3 feedback records
- 2 campaigns

### seed-products.js (Products)
- 18 products with tiered pricing (consumer, restaurant, retailer, distributor)
