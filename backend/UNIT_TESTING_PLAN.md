# Unit Testing Plan & Analysis

## Bohloko Family Farm — Backend API

**Version:** 2.0.0  
**Date:** 2026-08-08  
**Framework:** Jest 30.4.2  
**Coverage Target:** 80% minimum per service  
**Last Updated:** Comprehensive rewrite with actual mocked service tests

---

## 1. Testing Strategy Overview

### 1.1 Testing Levels

| Level | Scope | Tool | Status |
|-------|-------|------|--------|
| Unit Tests | Individual service methods with mocked dependencies | Jest | **Implemented** |
| Integration Tests | Service + Database interactions | Jest + Supertest | Planned |
| End-to-End Tests | Full HTTP request cycle | Supertest + Express | Future |

### 1.2 Testing Principles Applied

- **Isolation:** Each test runs independently; no shared state between tests
- **Determinism:** Tests produce the same result every run (mocked dependencies)
- **First Principles:** Test business logic, not implementation details
- **Single Responsibility:** One assertion per concept
- **Arrange-Act-Assert (AAA):** Standard test structure
- **DRY:** Shared fixtures in `tests/__fixtures__/index.js`
- **Fail-Fast:** Tests that catch errors early in the development cycle
- **Mock at Boundaries:** Mock external dependencies (DB, bcrypt, jwt) at module boundaries
- **Real Assertions:** Test actual service methods, not standalone logic

### 1.3 Test File Convention

```
backend/
  tests/
    __fixtures__/
      index.js            # Shared user, product, order, payment, inventory test data
    UserService.test.js   # User auth, registration, RBAC tests (35+ tests)
    OrderService.test.js  # Order lifecycle, stock, authorization tests (20+ tests)
    PaymentService.test.js # Payment CRUD, refunds, statistics tests (20+ tests)
    CartService.test.js   # Cart operations validation tests (planned)
    InventoryService.test.js # Stock management, FIFO tests (planned)
    ProductService.test.js # Product CRUD, filtering tests (planned)
    middleware/
      auth.test.js        # JWT verification, RBAC tests (planned)
    config/
      constants.test.js   # Enum validation tests (planned)
```

### 1.4 Test Execution

```bash
# Run all tests
cd backend && npm test

# Run with coverage report
cd backend && npx jest --coverage --coverageReporters=text-summary

# Run specific service tests
cd backend && npx jest tests/UserService.test.js

# Run tests matching pattern
cd backend && npx jest -t "should hash password"

# Run in watch mode (development)
cd backend && npx jest --watch

# Run with verbose output
cd backend && npx jest --verbose
```

---

## 2. Test Fixtures

### 2.1 Fixtures Location

`backend/tests/__fixtures__/index.js`

### 2.2 Fixture Data

| Fixture | Count | Purpose |
|---------|-------|---------|
| `users` | 9 objects | Admin, staff, customers, pending, suspended, locked |
| `products` | 4 objects | Active, featured, inactive products |
| `orders` | 4 objects | Pending, confirmed, shipped, cancelled |
| `payments` | 4 objects | Pending, paid, refunded, failed |
| `inventory` | 6 objects | Available, reserved, expired, low-stock items |
| `config` | 4 objects | System configuration key-value pairs |

### 2.3 User Fixture Roles

| Key | Role | Status | Purpose |
|-----|------|--------|---------|
| `admin` | Farm Manager | approved | Full access testing |
| `poultryAttendant` | Poultry Attendant | approved | Production access testing |
| `processingStaff` | Processing Staff | approved | Processing access testing |
| `salesAssistant` | Sales Assistant | approved | Sales access testing |
| `customer1` | Customer | approved | Consumer testing |
| `customer2` | Customer (Restaurant) | approved | Wholesale testing |
| `pendingUser` | Customer | pending | Approval workflow testing |
| `suspendedUser` | Customer | suspended | Lockout testing |
| `lockedUser` | Customer | approved (locked) | Login lockout testing |

---

## 3. Implemented Test Suites

### 3.1 UserService Tests (`tests/UserService.test.js`)

**Mock Strategy:**
- Mock `BaseRepository` with jest.fn() factory
- Mock `db.users` collection
- Mock `bcryptjs` and `jsonwebtoken` for auth testing
- Reset module cache in `beforeAll` to pick up mocks

**Test Coverage:**

| # | Method | Scenario | Type | Priority | Status |
|---|--------|----------|------|----------|--------|
| 1 | `generateToken` | Returns valid JWT with correct user ID | Positive | High | **Implemented** |
| 2 | `generateToken` | Includes expiry in the token | Positive | Medium | **Implemented** |
| 3 | `generateToken` | Throws if JWT_SECRET is missing | Negative | High | **Implemented** |
| 4 | `register` | Creates user with hashed password (not plaintext) | Positive | High | **Implemented** |
| 5 | `register` | Sets status to 'pending' by default | Positive | High | **Implemented** |
| 6 | `register` | Forces role to Customer regardless of input | Security | High | **Implemented** |
| 7 | `register` | Throws on duplicate email | Negative | High | **Implemented** |
| 8 | `register` | Lowercases email before storage | Positive | Medium | **Implemented** |
| 9 | `register` | Strips sensitive fields from response | Security | High | **Implemented** |
| 10 | `register` | Initializes failedLoginAttempts to 0 | Positive | Medium | **Implemented** |
| 11 | `login` | Returns user and token on valid credentials | Positive | High | **Implemented** |
| 12 | `login` | Uses generic error for wrong email (prevent enumeration) | Security | High | **Implemented** |
| 13 | `login` | Uses generic error for wrong password | Security | High | **Implemented** |
| 14 | `login` | Rejects login when account is locked | Negative | High | **Implemented** |
| 15 | `login` | Rejects login when status is pending | Negative | High | **Implemented** |
| 16 | `login` | Rejects login when status is suspended | Negative | High | **Implemented** |
| 17 | `login` | Resets failedLoginAttempts on success | Positive | Medium | **Implemented** |
| 18 | `login` | Updates lastLogin timestamp on success | Positive | Low | **Implemented** |
| 19 | `incrementLoginAttempts` | Increments counter on each failed attempt | Positive | Medium | **Implemented** |
| 20 | `incrementLoginAttempts` | Locks account after 5 failed attempts | Security | High | **Implemented** |
| 21 | `incrementLoginAttempts` | Does not lock before 5 attempts | Positive | Medium | **Implemented** |
| 22 | `getAll` | Returns all users with no filters | Positive | Medium | **Implemented** |
| 23 | `getAll` | Filters by status | Positive | Medium | **Implemented** |
| 24 | `getAll` | Filters by userType | Positive | Medium | **Implemented** |
| 25 | `getAll` | Searches by name with regex | Positive | Medium | **Implemented** |
| 26 | `getAll` | Handles special regex characters safely (ReDoS) | Security | High | **Implemented** |
| 27 | `getPending` | Returns only pending users | Positive | Medium | **Implemented** |
| 28 | `getStats` | Returns correct counts by status | Positive | Medium | **Implemented** |
| 29 | `getById` | Returns user when found | Positive | Low | **Implemented** |
| 30 | `getById` | Returns null when not found | Negative | Low | **Implemented** |
| 31 | `getByEmail` | Finds user by lowercase email | Positive | Low | **Implemented** |
| 32 | `resetPassword` | Hashes new password before storing | Security | High | **Implemented** |
| 33 | `create` | Creates user with status approved (admin-created) | Positive | High | **Implemented** |
| 34 | `create` | Allows assigning any role | Positive | Medium | **Implemented** |
| 35 | `create` | Throws on duplicate email | Negative | High | **Implemented** |
| 36 | `updateStatus` | Updates user status | Positive | Medium | **Implemented** |
| 37 | `updateRole` | Updates user role | Positive | Medium | **Implemented** |
| 38 | `updateProfile` | Allows user to update own profile | Positive | Medium | **Implemented** |
| 39 | `updateProfile` | Allows Farm Manager to update any profile | Security | High | **Implemented** |
| 40 | `updateProfile` | Rejects unauthorized updates | Security | High | **Implemented** |
| 41 | `updateProfile` | Only whitelists allowed fields | Security | High | **Implemented** |
| 42 | `bulkUpdateStatus` | Updates multiple users at once | Positive | Medium | **Implemented** |
| 43 | `softDelete` | Sets status to deleted (not hard delete) | Positive | Medium | **Implemented** |
| 44 | `softDelete` | Prevents deletion of Farm Manager | Security | High | **Implemented** |
| 45 | `softDelete` | Throws if user not found | Negative | Medium | **Implemented** |

**Coverage: 45/45 scenarios implemented (100%)**

---

### 3.2 OrderService Tests (`tests/OrderService.test.js`)

**Mock Strategy:**
- Mock `db` as a chainable Knex query builder
- Mock `uuid` for deterministic order IDs
- Reset module cache in `beforeAll`

**Test Coverage:**

| # | Method | Scenario | Type | Priority | Status |
|---|--------|----------|------|----------|--------|
| 1 | `create` | Creates order with ORD- prefix format | Positive | High | **Implemented** |
| 2 | `create` | Calculates 15% tax on subtotal | Positive | High | **Implemented** |
| 3 | `create` | Adds shipping cost for local_delivery | Positive | High | **Implemented** |
| 4 | `create` | No shipping cost for pickup | Positive | High | **Implemented** |
| 5 | `create` | Sets paymentStatus to Pending for cash | Positive | Medium | **Implemented** |
| 6 | `create` | Sets paymentStatus to Unpaid for non-cash | Positive | Medium | **Implemented** |
| 7 | `create` | Throws if product not found | Negative | High | **Implemented** |
| 8 | `create` | Throws if insufficient stock | Negative | High | **Implemented** |
| 9 | `getByUser` | Returns only orders for specified user | Positive | Medium | **Implemented** |
| 10 | `getByUser` | Parses JSON items field | Positive | Medium | **Implemented** |
| 11 | `getAll` | Returns all orders with customer name | Positive | Medium | **Implemented** |
| 12 | `getById` | Returns order when found | Positive | Medium | **Implemented** |
| 13 | `getById` | Throws when order not found | Negative | Medium | **Implemented** |
| 14 | `getById` | Allows owner to view own order | Security | High | **Implemented** |
| 15 | `getById` | Allows Farm Manager to view any order | Security | High | **Implemented** |
| 16 | `getById` | Allows Sales Assistant to view any order | Security | High | **Implemented** |
| 17 | `getById` | Rejects other customers viewing different order | Security | High | **Implemented** |
| 18 | `cancel` | Cancels order with reason | Positive | High | **Implemented** |
| 19 | `cancel` | Prevents cancellation after shipping | Business Rule | High | **Implemented** |
| 20 | `cancel` | Prevents cancellation after delivery | Business Rule | High | **Implemented** |
| 21 | `cancel` | Only allows owner or Farm Manager to cancel | Security | High | **Implemented** |
| 22 | `cancel` | Throws if order not found | Negative | Medium | **Implemented** |
| 23 | `count` | Returns total count | Positive | Low | **Implemented** |
| 24 | `count` | Filters by status | Positive | Low | **Implemented** |

**Coverage: 24/24 scenarios implemented (100%)**

---

### 3.3 PaymentService Tests (`tests/PaymentService.test.js`)

**Mock Strategy:**
- Mock `BaseRepository` with jest.fn() factory for both payment and order repos
- Mock `db` collections
- Reset module cache in `beforeAll`

**Test Coverage:**

| # | Method | Scenario | Type | Priority | Status |
|---|--------|----------|------|----------|--------|
| 1 | `create` | Generates payment number with PAY prefix | Positive | High | **Implemented** |
| 2 | `create` | Sets initial status to Pending | Positive | Medium | **Implemented** |
| 3 | `create` | Stores all provided data fields | Positive | Medium | **Implemented** |
| 4 | `getAll` | Returns all payments with no filters | Positive | Medium | **Implemented** |
| 5 | `getAll` | Filters by status | Positive | Medium | **Implemented** |
| 6 | `getAll` | Filters by method | Positive | Medium | **Implemented** |
| 7 | `getAll` | Filters by orderId | Positive | Medium | **Implemented** |
| 8 | `getAll` | Filters by userId | Positive | Medium | **Implemented** |
| 9 | `getById` | Returns payment when found | Positive | Low | **Implemented** |
| 10 | `getById` | Returns null when not found | Negative | Low | **Implemented** |
| 11 | `getByOrder` | Returns all payments for an order | Positive | Medium | **Implemented** |
| 12 | `getByUser` | Returns all payments for a user | Positive | Medium | **Implemented** |
| 13 | `processPayment` | Processes a pending payment | Positive | High | **Implemented** |
| 14 | `processPayment` | Throws if payment not found | Negative | Medium | **Implemented** |
| 15 | `processPayment` | Throws if payment already processed | Negative | High | **Implemented** |
| 16 | `refund` | Refunds a paid payment | Positive | High | **Implemented** |
| 17 | `refund` | Records refundReason and refundedAt | Positive | Medium | **Implemented** |
| 18 | `refund` | Throws if payment not found | Negative | Medium | **Implemented** |
| 19 | `refund` | Throws if payment not in Paid status (pending) | Business Rule | High | **Implemented** |
| 20 | `refund` | Throws if payment already refunded | Business Rule | High | **Implemented** |
| 21 | `refund` | Throws if payment failed | Business Rule | High | **Implemented** |
| 22 | `getStats` | Calculates totalRevenue from paid payments | Positive | Medium | **Implemented** |
| 23 | `getStats` | Calculates totalRefunded | Positive | Medium | **Implemented** |
| 24 | `getStats` | Breaks down by payment method | Positive | Medium | **Implemented** |
| 25 | `getStats` | Counts by status | Positive | Medium | **Implemented** |
| 26 | `count` | Returns total payment count | Positive | Low | **Implemented** |

**Coverage: 26/26 scenarios implemented (100%)**

---

## 4. Remaining Test Plans (Not Yet Implemented)

### 4.1 CartService (`services/CartService.js`)

**Dependencies:** `Cart` model  
**Methods:** 6  
**Estimated Tests:** 15

| # | Method | Scenario | Type | Priority |
|---|--------|----------|------|----------|
| 1 | `getCart` | Returns existing cart for user | Positive | Medium |
| 2 | `getCart` | Creates new cart if none exists | Positive | Medium |
| 3 | `addItem` | Adds item to cart | Positive | High |
| 4 | `addItem` | Throws if productId missing | Negative | High |
| 5 | `addItem` | Throws if quantity not positive | Negative | High |
| 6 | `addItem` | Throws if quantity exceeds 999 | Business Rule | Medium |
| 7 | `addItem` | Throws if price is negative | Negative | Medium |
| 8 | `addItem` | Accumulates quantity if item already in cart | Positive | High |
| 9 | `updateItem` | Updates item quantity | Positive | Medium |
| 10 | `updateItem` | Removes item when quantity is 0 | Business Rule | Medium |
| 11 | `updateItem` | Throws if productId missing | Negative | Medium |
| 12 | `removeItem` | Removes item from cart | Positive | Medium |
| 13 | `removeItem` | Throws if productId missing | Negative | Medium |
| 14 | `clear` | Removes all items from cart | Positive | Medium |
| 15 | `getSummary` | Returns items, total, itemCount | Positive | Medium |

### 4.2 InventoryService (`services/InventoryService.js`)

**Dependencies:** `BaseRepository`, `db`  
**Methods:** 9  
**Estimated Tests:** 24

| # | Method | Scenario | Type | Priority |
|---|--------|----------|------|----------|
| 1 | `create` | Generates batch number with BATCH prefix | Positive | Medium |
| 2 | `getAll` | Returns all inventory items | Positive | Medium |
| 3 | `getAll` | Filters by status, productType, location | Positive | Medium |
| 4 | `getLowStock` | Returns items below threshold | Business Rule | High |
| 5 | `getLowStock` | Uses configurable threshold | Positive | Medium |
| 6 | `adjust` | Increases quantity with positive adjustment | Positive | Medium |
| 7 | `adjust` | Decreases quantity with negative adjustment | Positive | Medium |
| 8 | `adjust` | Prevents negative stock (floors at 0) | Business Rule | High |
| 9 | `adjust` | Throws if batch not found | Negative | Medium |
| 10 | `transfer` | Creates new batch at destination | Positive | High |
| 11 | `transfer` | Reduces source batch quantity | Positive | High |
| 12 | `transfer` | Marks source as transferred when depleted | Positive | Medium |
| 13 | `transfer` | Throws if batch not found | Negative | Medium |
| 14 | `transfer` | Throws if transfer quantity exceeds stock | Business Rule | High |
| 15 | `getTransfers` | Returns items with transferredFrom field | Positive | Low |
| 16 | `getPickingList` | Allocates using FIFO by expiry date | Business Rule | High |
| 17 | `getPickingList` | Returns shortfalls when stock insufficient | Positive | Medium |
| 18 | `getPickingList` | Sets allFulfilled correctly | Positive | Medium |
| 19 | `getPickingList` | Throws if order not found | Negative | Medium |
| 20 | `getReport` | Calculates totalItems, totalValue, totalQuantity | Positive | Medium |
| 21 | `getReport` | Groups by status, productType, location | Positive | Medium |
| 22 | `getReport` | Identifies near-expiry (within 7 days) | Business Rule | Medium |
| 23 | `getReport` | Identifies expired items | Business Rule | Medium |
| 24 | `getReport` | Calculates turnover rate | Positive | Low |

### 4.3 ProductService (`services/ProductService.js`)

**Dependencies:** `db` (Knex), `uuid`  
**Methods:** 13  
**Estimated Tests:** 18

| # | Method | Scenario | Type | Priority |
|---|--------|----------|------|----------|
| 1 | `create` | Auto-generates slug from name | Positive | Medium |
| 2 | `create` | Sets default unit to 'pieces' | Positive | Low |
| 3 | `create` | Sets available to true by default | Positive | Low |
| 4 | `create` | Sets tiered pricing from base price | Positive | Medium |
| 5 | `getAll` | Returns all products | Positive | Medium |
| 6 | `getAll` | Filters by status (active/inactive) | Positive | Medium |
| 7 | `getAll` | Filters by category | Positive | Medium |
| 8 | `getAll` | Filters featured products | Positive | Medium |
| 9 | `getAll` | Searches across name, description, sku, category | Positive | Medium |
| 10 | `getAll` | Applies sorting (field:direction) | Positive | Medium |
| 11 | `getAll` | Applies limit | Positive | Low |
| 12 | `update` | Prevents overwriting id, created_by, created_at | Security | High |
| 13 | `delete` | Soft-deletes by setting available to false | Positive | Medium |
| 14 | `getActive` | Returns only available products | Positive | Medium |
| 15 | `getFeatured` | Returns available + featured products | Positive | Medium |
| 16 | `getByCategory` | Returns products in category | Positive | Low |
| 17 | `getCategories` | Returns distinct categories from active products | Positive | Low |
| 18 | `updateStock` | Throws if product not found | Negative | Medium |

### 4.4 Middleware Tests

#### auth.js

| # | Function | Scenario | Type | Priority |
|---|----------|----------|------|----------|
| 1 | `protect` | Attaches req.user on valid token | Security | High |
| 2 | `protect` | Returns 401 if no token | Security | High |
| 3 | `protect` | Returns 401 if token blacklisted | Security | High |
| 4 | `protect` | Returns 401 if token invalid/expired | Security | High |
| 5 | `protect` | Returns 401 if user not found | Security | High |
| 6 | `protect` | Returns 403 if account not approved | Security | High |
| 7 | `authorize` | Allows access for matching role | Security | High |
| 8 | `authorize` | Returns 403 for non-matching role | Security | High |
| 9 | `authorize` | Works with multiple roles | Security | Medium |
| 10 | `blacklistToken` | Adds token to blacklist Set | Security | Medium |

#### validate.js

| # | Function | Scenario | Type | Priority |
|---|----------|----------|------|----------|
| 1 | `validate` | Calls next() when no validation errors | Positive | High |
| 2 | `validate` | Returns 400 with errors array on failure | Validation | High |

### 4.5 Remaining Services (Estimated)

| Service | Methods | Est. Tests | Priority |
|---------|---------|------------|----------|
| ProductionService | 18 | 13 | Medium |
| HarvestService | 17 | 13 | Medium |
| MedicationService | 9 | 8 | Medium |
| ContactService | 6 | 14 | Medium |
| ConfigService | 5 | 11 | Medium |
| SystemLogService | 10 | 10 | Low |
| ComplianceService | 8 | 8 | Medium |
| CrmService | 18 | 21 | Medium |
| DataService | 6+1 | 13 | Medium |
| ApiKeyService | 10 | 10 | Low |
| AnalyticsService | 5 | 12 | Low |
| NotificationService | 10 | 9 | Low |
| NotificationConfigService | 8 | 6 | Low |
| EmployeeService | 8 | 5 | Low |

### 4.6 Constants Test Plan

| # | Constant | Scenario | Type | Priority |
|---|----------|----------|------|----------|
| 1 | `PRODUCT_TYPES` | Contains expected 10 product types | Positive | Low |
| 2 | `USER_TYPES` | Contains expected 7 user types | Positive | Low |
| 3 | `USER_ROLES` | Contains expected 5 roles | Positive | Low |
| 4 | `ORDER_STATUSES` | Contains all 6 lifecycle statuses | Positive | Low |
| 5 | `PAYMENT_METHODS` | Contains all 4 payment methods | Positive | Low |
| 6 | `DELIVERY_OPTIONS` | Contains all 3 delivery options | Positive | Low |
| 7 | `USER_STATUSES` | Contains all 5 user lifecycle statuses | Positive | Low |
| 8 | `BATCH_STATUSES` | Contains all 4 batch statuses | Positive | Low |
| 9 | `COMPLIANCE_STATUSES` | Contains Pass, Fail, Conditional | Positive | Low |
| 10 | `LOYALTY_TIERS` | Contains all 5 loyalty tiers | Positive | Low |

---

## 5. Priority Matrix

### 5.1 By Business Criticality

| Priority | Services | Focus Areas | Status |
|----------|----------|-------------|--------|
| **Critical** | UserService, OrderService, PaymentService | Authentication, payments, order processing, security | **Implemented** |
| **High** | InventoryService, ProductService, CartService | Stock management, product catalog, cart operations | Planned |
| **Medium** | ProductionService, HarvestService, CrmService | Business operations, CRM, loyalty | Planned |
| **Low** | NotificationService, SystemLogService, ConfigService | Support functions, logging, configuration | Planned |

### 5.2 By Risk Level

| Risk | Area | Reason | Test Status |
|------|------|--------|-------------|
| **High** | Password handling | Security — hashing, lockout, enumeration | **Tested** |
| **High** | JWT authentication | Security — token generation, verification, blacklisting | **Tested** |
| **High** | Payment processing | Financial — refund logic, status transitions | **Tested** |
| **High** | Order cancellation | Financial — inventory release, refund triggers | **Tested** |
| **High** | RBAC authorization | Security — role-based access control | **Tested** |
| **Medium** | Inventory transfers | Business — stock accuracy, batch tracking | Planned |
| **Medium** | Config whitelisting | Security — prevents unauthorized config changes | Planned |
| **Medium** | Path traversal (DataService) | Security — file system access | Planned |
| **Low** | Analytics calculations | Accuracy — reporting correctness | Planned |

---

## 6. Mocking Strategy

### 6.1 Database Layer

All services depend on `db` (Knex instance) or `BaseRepository`. Mock at the repository level:

**Pattern 1: BaseRepository Mock (UserService, PaymentService, InventoryService)**
```javascript
jest.mock('../repositories/BaseRepository', () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    collection: { update: jest.fn() }
  }));
});
```

**Pattern 2: Knex Chainable Mock (OrderService, ProductService)**
```javascript
jest.mock('../config/db', () => {
  const mockKnex = jest.fn(() => mockKnex);
  mockKnex.where = jest.fn(() => mockKnex);
  mockKnex.first = jest.fn();
  mockKnex.insert = jest.fn();
  mockKnex.update = jest.fn();
  mockKnex.select = jest.fn(() => mockKnex);
  mockKnex.leftJoin = jest.fn(() => mockKnex);
  mockKnex.orderBy = jest.fn(() => mockKnex);
  return mockKnex;
});
```

### 6.2 External Dependencies

| Dependency | Mock Approach | Used By |
|------------|---------------|---------|
| `bcryptjs` | Real (no mock needed for hash/compare testing) | UserService |
| `jsonwebtoken` | Real with mocked env vars | UserService |
| `uuid` | Mock `v4` to return deterministic IDs | OrderService, ProductService |
| `fs` (DataService) | Mock `readFileSync`, `writeFileSync` | DataService |
| `crypto` (ApiKeyService) | Mock `randomBytes` | ApiKeyService |

### 6.3 Environment Variables

```javascript
// Set in test setup or beforeEach
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
```

### 6.4 Module Cache Reset

Critical for singleton services — use `jest.resetModules()` in `beforeAll`:

```javascript
let UserService;
beforeAll(() => {
  jest.resetModules();
  UserService = require('../services/UserService');
});
```

---

## 7. Coverage Thresholds

| Module | Lines | Branches | Functions | Statements |
|--------|-------|----------|-----------|------------|
| Services (Implemented) | 85% | 80% | 85% | 85% |
| Services (Planned) | 80% | 75% | 80% | 80% |
| Middleware | 90% | 85% | 90% | 90% |
| Config | 100% | 100% | 100% | 100% |
| **Overall Target** | **80%** | **75%** | **80%** | **80%** |

---

## 8. Test Implementation Roadmap

| Phase | Scope | Est. Tests | Status |
|-------|-------|------------|--------|
| Phase 1 | UserService, OrderService, PaymentService | 95 | **Completed** |
| Phase 2 | ProductService, CartService, InventoryService | 57 | Planned |
| Phase 3 | ProductionService, HarvestService, MedicationService | 34 | Planned |
| Phase 4 | CrmService, ContactService, ConfigService | 46 | Planned |
| Phase 5 | Remaining services, middleware | 126 | Planned |
| Phase 6 | Integration tests, edge cases | 50+ | Future |
| **Total** | | **~408+** | |

---

## 9. Test Data Security

| Concern | Mitigation |
|---------|-----------|
| Passwords in fixtures | Pre-hashed bcrypt values, never plaintext in assertions |
| Test user emails | Distinct from production (example.com domain) |
| API keys | All test keys prefixed with `test-` |
| Environment secrets | Mock values, never real JWT_SECRET or API keys |
| Database isolation | Mocked repositories, no real DB writes in unit tests |

---

## 10. Running Tests

```bash
# Full test suite
cd backend && npm test

# With coverage
cd backend && npx jest --coverage

# Specific test file
cd backend && npx jest tests/UserService.test.js

# Watch mode
cd backend && npx jest --watch

# Verbose output
cd backend && npx jest --verbose

# Run tests matching description
cd backend && npx jest -t "should hash"

# Force exit (if tests hang)
cd backend && npm test -- --forceExit
```

---

*Document generated from codebase analysis of Bohloko Family Farm Backend v1.0.0*  
*Last updated: 2026-08-08 — Added 95 implemented tests across 3 service test files*
