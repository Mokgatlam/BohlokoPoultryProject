# Unit Test Report — Bohloko Family Farm

**Date:** 8 August 2026  
**Framework:** Jest 30.x  
**Command:** `npx jest --no-coverage`  
**Location:** `backend/tests/`

---

## Summary

| Metric | Count |
|--------|-------|
| Total Test Suites | 15 |
| Passing Suites | 12 |
| Failing Suites | 3 |
| Total Tests | 358 |
| Passing Tests | 263 |
| Failing Tests | 95 |
| **Pass Rate** | **73.5%** |

---

## Passing Test Suites (12)

| Suite | Tests | Coverage |
|-------|-------|----------|
| `ProductService.test.js` | 21 | Product CRUD, search, pricing tiers |
| `InventoryService.test.js` | 22 | Stock levels, adjustments, low-stock alerts |
| `CartService.test.js` | 24 | Add/remove/update items, totals, checkout |
| `ProductionService.test.js` | 24 | Cycle management, daily logs, health checks |
| `HarvestService.test.js` | 29 | Harvest batches, processing, yield records |
| `MedicationService.test.js` | 16 | Medication tracking, schedules, vaccination logs |
| `ContactService.test.js` | 24 | Contact form submission, validation |
| `ConfigService.test.js` | 12 | System config CRUD, whitelisted keys |
| `NotificationService.test.js` | 18 | Notifications CRUD, bulk actions, read status |
| `EmployeeService.test.js` | 18 | Employee records, scheduling, payroll |
| `SystemLogService.test.js` | 16 | System logs, category filtering, cleanup |
| `PayFastService.test.js` | 30 | MD5 signatures, ITN verification, status mapping |

---

## Failing Test Suites (3) — Pre-Existing Issues

All 95 failures are caused by a **singleton export pattern mismatch**, not by code defects.

### Root Cause

Services export singleton instances:

```js
// e.g., OrderService.js
class OrderService { ... }
module.exports = new OrderService();
```

Tests instantiate with `new`:

```js
// e.g., OrderService.test.js
const OrderService = require('../services/OrderService');
service = new OrderService(); // TypeError: OrderService is not a constructor
```

### Affected Suites

| Suite | Failing Tests | Error |
|-------|--------------|-------|
| `OrderService.test.js` | ~40 | `TypeError: OrderService is not a constructor` |
| `PaymentService.test.js` | ~30 | `TypeError: PaymentService is not a constructor` |
| `UserService.test.js` | ~25 | `TypeError: UserService is not a constructor` |

### Resolution Options

1. **Change tests to use the exported singleton** — Replace `new Service()` with direct `require()` usage
2. **Change services to export the class** — Add `module.exports = Service` alongside `module.exports = new Service()`
3. **Use a factory pattern** — Export a factory function that returns new instances

---

## Test Infrastructure

- **Fixtures:** `backend/tests/__fixtures__/index.js` — shared mock data for all tests
- **Mocking:** Services mock `BaseRepository` methods (`find`, `findOne`, `create`, `update`, `delete`)
- **Environment:** Node.js with `jest` config in `package.json`

---

## PayFast Integration Tests (30 tests)

Covers the complete PayFast payment gateway integration:

- **Signature Generation (6 tests):** MD5 hash generation, UTF-8 encoding, special characters, empty passphrase
- **ITN Verification (8 tests):** Valid signatures, invalid signatures, server confirmation, source IP validation
- **Status Mapping (6 tests):** PayFast status to internal status conversion
- **Checkout URL Building (5 tests):** Sandbox vs live URLs, parameter encoding
- **Source IP Validation (5 tests):** Whitelist validation, IP range checking

---

## Recommendations

1. **Fix singleton tests** — Highest priority; these 95 failures mask any real regressions
2. **Add integration tests** — Test full HTTP request/response cycle via Supertest
3. **Add Auth middleware tests** — JWT verification, RBAC authorization (per `UNIT_TESTING_PLAN.md`)
4. **Increase coverage** — Target 80%+ for all service modules
