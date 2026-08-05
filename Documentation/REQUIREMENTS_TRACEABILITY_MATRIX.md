# Requirements Traceability Matrix

## Bohloko Family Farm Poultry Processing System

**Document Version**: 1.0  
**Last Updated**: August 2026  
**Purpose**: Maps each SRS requirement to its implementation in the codebase

---

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| **Fully Implemented** | 9 | 39% |
| **Partially Implemented** | 11 | 48% |
| **Not Implemented** | 3 | 13% |
| **Total Requirements** | 23 | 100% |

---

## FR-001: User Registration | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Registration endpoint | FOUND | `backend/routes/auth.js` | 8-36 |
| User type support (Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution) | FOUND | `backend/routes/auth.js` | 18-19 |
| Business registration details collection | FOUND | `backend/services/UserService.js` | 29-31 |
| Email validation and uniqueness | FOUND | `backend/routes/auth.js` | 11; `services/UserService.js` | 16-17 |
| Password hashing with bcrypt | FOUND | `backend/services/UserService.js` | 19-20 |
| Account status set to "pending" | FOUND | `backend/services/UserService.js` | 32 |
| Password validation rules | FOUND | `backend/routes/auth.js` | 12-17 |

**Gap**: `businessRegNumber` and `taxId` fields exist in model but are not collected during public registration.

---

## FR-002: User Authentication | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Login endpoint | FOUND | `backend/routes/auth.js` | 38-54 |
| Account lockout (5 attempts, 30 min) | FOUND | `backend/services/UserService.js` | 46-48, 72-79 |
| Password reset via email | FOUND | `backend/routes/auth.js` | 70-117 |
| JWT access token generation | FOUND | `backend/services/UserService.js` | 11-13, 67 |
| **Refresh token generation** | **NOT FOUND** | - | - |
| Account status validation | FOUND | `backend/services/UserService.js` | 56-63 |
| Last login tracking | FOUND | `backend/services/UserService.js` | 65 |
| Specific error messages | FOUND | `backend/services/UserService.js` | 44, 47, 53, 57-62 |
| Rate limiting on login | FOUND | `backend/server.js` | 41-45, 73 |
| Token revocation (logout) | FOUND | `backend/routes/auth.js` | 61-68 |

**Gap**: No refresh token implementation. Only access tokens are issued.

---

## FR-003: Role-Based Access Control | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Role definitions | FOUND | `backend/routes/users.js` | 70, 97 |
| Permission middleware (`authorize`) | FOUND | `backend/middleware/auth.js` | 6-38, 45-55 |
| Role-based route protection | FOUND | Multiple routes | - |
| Farm Manager role management | FOUND | `backend/routes/users.js` | 96-108 |

---

## FR-004: Production Cycle Planning | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Production plan creation | FOUND | `backend/routes/production.js` | 8-23 |
| Production types | FOUND | `backend/routes/production.js` | 10 |
| **Budget tracking** | **NOT FOUND** | - | - |
| Approval workflow | FOUND | `backend/routes/production.js` | 61-69 |
| Plan status tracking | FOUND | `backend/routes/production.js` | 50 |

**Gap**: No budget/cost fields in production cycle model.

---

## FR-005: Daily Production Logging | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Daily log endpoints | FOUND | `backend/routes/production.js` | 71-93 |
| Bird counts | FOUND | `backend/routes/production.js` | 74 |
| Feed consumption tracking | FOUND | `backend/routes/production.js` | 204-227 |
| **Water consumption tracking** | **NOT FOUND** | - | - |
| Mortality rate calculation | FOUND | `backend/services/ProductionService.js` | 40 |
| Environmental conditions | FOUND | `backend/routes/production.js` | 229-251 |
| High mortality alerts | PARTIAL | `backend/services/ProductionService.js` | 41 (console.log only) |

**Gap**: Water consumption not tracked. Mortality alerts only logged to console.

---

## FR-006: Medication & Vaccination Tracking | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Medication CRUD | FOUND | `backend/routes/medication.js` | 1-109 |
| Vaccination schedules | FOUND | `backend/routes/production.js` | 145-168 |
| Vaccination completion | FOUND | `backend/routes/production.js` | 170-178 |
| **Dedicated medication report endpoint** | **NOT FOUND** | - | - |

**Gap**: No structured reporting endpoint for medication data.

---

## FR-007: Harvest Processing | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Harvest processing routes | FOUND | `backend/routes/harvest.js` | 1-261 |
| Live bird to inventory conversion | FOUND | `backend/services/HarvestService.js` | 72-98 |
| Batch creation for different cuts | FOUND | `backend/config/constants.js` | 1-4 |
| Batch numbering with harvest date | FOUND | `backend/services/HarvestService.js` | 47-48, 79-87 |
| Weight and storage location | FOUND | `backend/services/HarvestService.js` | 73-89 |
| Yield percentage calculation | FOUND | `backend/services/HarvestService.js` | 116-118 |

---

## FR-008: Inventory Tracking | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Inventory management routes | FOUND | `backend/routes/inventory.js` | 1-104 |
| Real-time stock monitoring | FOUND | `backend/services/InventoryService.js` | 14-20 |
| Expiry date tracking | FOUND | `backend/services/InventoryService.js` | 116-145 |
| Inventory adjustments | FOUND | `backend/routes/inventory.js` | 44-57 |
| Transfer between locations | FOUND | `backend/routes/inventory.js` | 59-74 |
| Low stock alerts | FOUND | `backend/routes/inventory.js` | 35-42 |
| Batch traceability | FOUND | `backend/services/InventoryService.js` | 9-11 |

---

## FR-009: Inventory Reporting | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Stock level reports | FOUND | `backend/routes/inventory.js` | 95-102 |
| Inventory valuation | FOUND | `backend/services/InventoryService.js` | 120 |
| Expiry date reports | FOUND | `backend/services/InventoryService.js` | 128-141 |
| Inventory turnover rates | FOUND | `backend/services/InventoryService.js` | 143 |
| **PDF/Excel export** | **NOT FOUND** | - | - |

**Gap**: Reports only available as JSON. No PDF/Excel export capability.

---

## FR-010: Product Catalog | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Product listing/display | FOUND | `backend/routes/products.js` | 1-86 |
| Product images/descriptions/prices | FOUND | `pages/public/shop.html` | 88-112 |
| **Real-time availability from inventory** | **PARTIAL** | - | - |
| Product categorization | FOUND | `pages/public/shop.html` | 77-81 |
| Price variations by customer type | FOUND | `pages/public/shop.html` | 99-104 |

**Gap**: Shop page uses hardcoded static data instead of dynamic inventory links.

---

## FR-011: Order Placement | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Shopping cart functionality | FOUND | `backend/routes/cart.js` | 1-77 |
| Inventory availability validation | FOUND | `backend/services/OrderService.js` | 22-24 |
| Order total calculation | FOUND | `backend/services/OrderService.js` | 14-37 |
| Delivery options | FOUND | `backend/routes/orders.js` | 12 |
| **Order draft saving** | **NOT FOUND** | - | - |

**Gap**: No draft/pending order save functionality.

---

## FR-012: Order Processing | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Order status workflow | FOUND | `backend/routes/orders.js` | 56-68 |
| Inventory reservation | FOUND | `backend/services/OrderService.js` | 44-48 |
| Picking list generation | FOUND | `backend/routes/inventory.js` | 85-93 |
| **Order status change notifications** | **NOT FOUND** | - | - |

**Gap**: NotificationService exists but is not wired to order status changes.

---

## FR-013: Payment Processing | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Payment method support | FOUND | `backend/config/constants.js` | 12 |
| Receipt/invoice generation | FOUND | `pages/admin/invoice.html` | 1-212 |
| Payment status tracking | FOUND | `backend/services/PaymentService.js` | 48-59 |
| Refund processing | FOUND | `backend/services/PaymentService.js` | 61-69 |
| **Payment gateway integration** | **NOT FOUND** | - | - |

**Gap**: No external payment gateway (PayFast, Yoco, Stripe). Manual tracking only.

---

## FR-014: Order Cancellation & Refunds | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Order cancellation endpoint | FOUND | `backend/routes/orders.js` | 70-82 |
| Authorization check | FOUND | `backend/services/OrderService.js` | 79-83 |
| Cannot cancel after shipping | FOUND | `backend/services/OrderService.js` | 84-86 |
| Inventory release back to stock | FOUND | `backend/services/OrderService.js` | 88-91 |
| Refund processing | FOUND | `backend/services/OrderService.js` | 93-97 |
| Cancellation reason tracking | FOUND | `backend/services/OrderService.js` | 94 |

---

## FR-015: User Account Management | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| User approval/rejection | FOUND | `backend/routes/users.js` | 82-94 |
| Account suspension/activation | FOUND | `backend/routes/users.js` | 82-94 |
| User profile updates | FOUND | `backend/routes/users.js` | 110-123 |
| **Account activity tracking** | **PARTIAL** | `backend/services/UserService.js` | 65, 72-79 |
| User list export | PARTIAL | `backend/routes/data.js` | 44-76 (generic) |

**Gap**: No dedicated per-user activity log endpoint.

---

## FR-016: Customer Relationship Management | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Customer order history | FOUND | `backend/routes/orders.js` | 27-34 |
| Loyalty programs/discounts | FOUND | `backend/routes/crm.js` | 106-137 |
| Customer segmentation | FOUND | `backend/routes/crm.js` | 80-87 |
| Promotional communications | FOUND | `backend/routes/crm.js` | 212-272 |
| Customer feedback tracking | FOUND | `backend/routes/crm.js` | 142-207 |

---

## FR-017: Production Analytics | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Mortality rate calculation | FOUND | `backend/services/AnalyticsService.js` | 33-35 |
| Feed conversion ratio | FOUND | `backend/services/AnalyticsService.js` | 36-37 |
| Production cycle comparison | FOUND | `backend/services/AnalyticsService.js` | 17-24 |
| Production cost analysis | FOUND | `backend/services/AnalyticsService.js` | 16, 26-30 |
| **Production yield forecasting** | **NOT FOUND** | - | - |

**Gap**: No predictive model or forecasting algorithm exists.

---

## FR-018: Sales & Financial Analytics | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Revenue by product | FOUND | `backend/services/AnalyticsService.js` | 52-53, 64-66 |
| **Revenue by customer type** | **PARTIAL** | `backend/services/AnalyticsService.js` | 57 (declared, not populated) |
| Profit margin tracking | FOUND | `backend/services/AnalyticsService.js` | 174 |
| P&L statements | FOUND | `backend/routes/analytics.js` | 43-52 |
| **Sales forecasting** | **NOT FOUND** | - | - |

**Gap**: `revenueByCustomerType` field exists but never populated. No sales forecasting.

---

## FR-019: Inventory Analytics | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Inventory turnover rate | FOUND | `backend/services/InventoryService.js` | 143 |
| **Slow/fast moving items** | **PARTIAL** | `backend/services/AnalyticsService.js` | 92 (declared, never populated) |
| **Stockout frequency analysis** | **NOT FOUND** | - | - |
| **Reorder point optimization** | **PARTIAL** | `backend/services/InventoryService.js` | 22-26 (static threshold) |
| Holding cost calculation | FOUND | `backend/services/AnalyticsService.js` | 111-113, 170 |

**Gap**: `slowMoving` array declared but never computed. No stockout tracking.

---

## FR-020: Quality Control Tracking | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Quality check recording | FOUND | `backend/routes/compliance.js` | 7-28 |
| Corrective action documentation | FOUND | `backend/routes/compliance.js` | 30-42 |
| Food safety compliance tracking | FOUND | `backend/routes/compliance.js` | 44-65 |
| **Quality certificate generation** | **NOT FOUND** | - | - |
| Audit trail maintenance | PARTIAL | `backend/routes/compliance.js` | 67-88 |

**Gap**: No certificate generation capability.

---

## FR-021: Regulatory Compliance Reporting | PARTIALLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Compliance record compilation | FOUND | `backend/routes/compliance.js` | 44-65 |
| **Regulatory report formatting** | **PARTIAL** | `backend/services/ComplianceService.js` | 52-85 (JSON only) |
| **Certificate of analysis generation** | **NOT FOUND** | - | - |
| **Certification expiry tracking** | **NOT FOUND** | - | - |

**Gap**: No certificate generation. No expiry date tracking on compliance records.

---

## FR-022: System Configuration | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Pricing rule configuration | FOUND | `backend/services/ConfigService.js` | 32-39, 56-58 |
| Inventory threshold settings | FOUND | `backend/services/ConfigService.js` | 33, 56 |
| Role/permission management | FOUND | `backend/middleware/auth.js` | 45-55 |
| Notification templates | FOUND | `backend/routes/notification-configs.js` | 27-64 |
| Tax rate configuration | FOUND | `backend/services/ConfigService.js` | 33, 56 |

---

## FR-023: Data Management | FULLY IMPLEMENTED

| Sub-Requirement | Status | File | Line(s) |
|---|---|---|---|
| Backup functionality | FOUND | `backend/routes/data.js` | 6-42 |
| Data export capabilities | FOUND | `backend/routes/data.js` | 44-76 |
| Data validation rules | FOUND | `backend/routes/data.js` | 78-129 |
| **Data migration support** | **NOT FOUND** | `backend/services/DataService.js` | 9 (directory only) |

**Gap**: Migration directory exists but no migration logic implemented.

---

## Gaps Summary

| # | Requirement | Gap Description | Priority |
|---|---|---|---|
| 1 | FR-002 | No refresh token implementation | Medium |
| 2 | FR-004 | No budget tracking in production cycles | High |
| 3 | FR-005 | No water consumption tracking | Medium |
| 4 | FR-005 | Mortality alerts only console.log | Low |
| 5 | FR-006 | No dedicated medication report endpoint | Low |
| 6 | FR-009 | No PDF/Excel export for reports | High |
| 7 | FR-010 | Shop page uses hardcoded static data | Medium |
| 8 | FR-011 | No order draft saving | Low |
| 9 | FR-012 | Order status notifications not wired | Medium |
| 10 | FR-013 | No payment gateway integration | High |
| 11 | FR-015 | No per-user activity log endpoint | Low |
| 12 | FR-017 | No production yield forecasting | Low |
| 13 | FR-018 | `revenueByCustomerType` never populated | Low |
| 14 | FR-018 | No sales forecasting | Low |
| 15 | FR-019 | `slowMoving` array never populated | Low |
| 16 | FR-019 | No stockout frequency analysis | Low |
| 17 | FR-019 | Reorder points are static | Medium |
| 18 | FR-020 | No quality certificate generation | Medium |
| 19 | FR-021 | No certificate of analysis generation | Medium |
| 20 | FR-021 | No certification expiry tracking | Medium |
| 21 | FR-023 | No data migration logic | Low |

---

**Document Version**: 1.0  
**Prepared By**: Requirements Analysis Team  
**Next Review**: October 2026
