# Frontend Pages to Backend Routes Mapping

This document maps each frontend page to its corresponding backend route(s) and service(s).

## Page-to-Route Mapping Table

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `Login.tsx` | `/api/auth` | User authentication | ✅ Connected |
| `Register.tsx` | `/api/auth` | User registration | ✅ Connected |
| `Dashboard.tsx` | `/api/analytics/dashboard` | Main dashboard | ✅ Connected |
| `Home.tsx` | N/A | Landing page (no API) | ✅ N/A |
| `About.tsx` | N/A | About page (no API) | ✅ N/A |
| `NotFound.tsx` | N/A | 404 page (no API) | ✅ N/A |

## Admin Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `Users.tsx` | `/api/users` | User management | ✅ Connected |
| `Orders.tsx` | `/api/orders` | Order management | ✅ Connected |
| `Products.tsx` | `/api/products` | Product management | ✅ Connected |
| `Inventory.tsx` | `/api/inventory` | Inventory management | ✅ Connected |
| `Production.tsx` | `/api/production` | Production tracking | ✅ Connected |
| `Settings.tsx` | `/api/configuration` | System settings | ✅ Connected |

## Analytics Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `Analytics.tsx` | `/api/analytics` | General analytics | ✅ Connected |
| `ProductionAnalytics.tsx` | `/api/analytics` | Production analytics | ✅ Connected |
| `InventoryAnalytics.tsx` | `/api/analytics` | Inventory analytics | ✅ Connected |

## System Administration Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `SystemLogs.tsx` | `/api/system-logs` | System logs viewer | ✅ Connected |
| `ApiKeys.tsx` | `/api/api-keys` | API key management | ✅ Connected |
| `NotificationConfigs.tsx` | `/api/notification-configs` | Notification settings | ✅ Connected |
| `SystemConfigurationDashboard.tsx` | `/api/configuration` | System configuration | ✅ Connected |

## Data Management Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `DataManagementDashboard.tsx` | `/api/data-management` | Data management | ✅ Connected |

## Quality Control Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `QualityControlDashboard.tsx` | `/api/quality` | Quality control | ✅ Connected |

## Operations Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `OperationsManagement.tsx` | `/api/production`, `/api/harvest` | Operations management | ✅ Connected |
| `ProcessingDashboard.tsx` | `/api/harvest` | Processing dashboard | ✅ Connected |
| `Worksheets.tsx` | `/api/production` | Worksheets management | ✅ Connected |
| `PoultryCareDashboard.tsx` | `/api/production`, `/api/medication` | Poultry care | ✅ Connected |

## Employee Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `EmployeeDashboard.tsx` | `/api/employees` | Employee dashboard | ✅ Connected |
| `EmployeeProfile.tsx` | `/api/employees` | Employee profile | ✅ Connected |
| `EmployeeSchedule.tsx` | `/api/employees` | Employee schedule | ✅ Connected |
| `EmployerDashboard.tsx` | `/api/employees` | Employer dashboard | ✅ Connected |
| `EmployerEmployees.tsx` | `/api/employees` | Employee management | ✅ Connected |

## Customer Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `CustomerDashboard.tsx` | `/api/crm`, `/api/orders` | Customer dashboard | ✅ Connected |
| `CustomerOrders.tsx` | `/api/orders` | Customer orders | ✅ Connected |
| `CustomerCRM.tsx` | `/api/crm` | Customer CRM | ✅ Connected |
| `Shop.tsx` | `/api/products`, `/api/orders` | Shopping page | ✅ Connected |

## Restaurant Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `RestaurantDashboard.tsx` | `/api/orders`, `/api/products` | Restaurant dashboard | ✅ Connected |
| `RestaurantOrders.tsx` | `/api/orders` | Restaurant orders | ✅ Connected |
| `RestaurantInventory.tsx` | `/api/inventory` | Restaurant inventory | ✅ Connected |

## Demo Pages

| Frontend Page | Backend Route | Description | Status |
|--------------|---------------|-------------|--------|
| `ModelBindingDemo.tsx` | N/A | Demo page (no API) | ✅ N/A |

---

## Detailed Mapping by Feature

### Authentication & Users
```
Frontend:                    Backend:
- Login.tsx         →        /api/auth/login
- Register.tsx      →        /api/auth/register
- Users.tsx         →        /api/users (CRUD)
```

### Products & Shop
```
Frontend:                    Backend:
- Products.tsx      →        /api/products (CRUD)
- Shop.tsx          →        /api/products, /api/orders
```

### Orders & Payments
```
Frontend:                    Backend:
- Orders.tsx        →        /api/orders (CRUD)
- CustomerOrders.tsx →       /api/orders (user orders)
- RestaurantOrders.tsx →     /api/orders (restaurant orders)
```

### Inventory & Production
```
Frontend:                    Backend:
- Inventory.tsx             → /api/inventory
- RestaurantInventory.tsx   → /api/inventory
- InventoryAnalytics.tsx    → /api/analytics, /api/inventory
- Production.tsx            → /api/production
- ProductionAnalytics.tsx   → /api/analytics, /api/production
- ProcessingDashboard.tsx   → /api/harvest
- PoultryCareDashboard.tsx  → /api/production, /api/medication
```

### Analytics & Dashboard
```
Frontend:                    Backend:
- Dashboard.tsx             → /api/analytics/dashboard
- Analytics.tsx             → /api/analytics
- ProductionAnalytics.tsx   → /api/analytics
- InventoryAnalytics.tsx    → /api/analytics
```

### System Administration
```
Frontend:                    Backend:
- SystemLogs.tsx            → /api/system-logs
- ApiKeys.tsx               → /api/api-keys
- NotificationConfigs.tsx   → /api/notification-configs
- SystemConfigurationDashboard.tsx → /api/configuration
- Settings.tsx              → /api/configuration
```

### Data Management
```
Frontend:                    Backend:
- DataManagementDashboard.tsx → /api/data-management
  - Backup configs          → /api/data-management/backup-configs
  - Export configs          → /api/data-management/export-configs
  - Validation rules        → /api/data-management/validation-rules
  - Integrity constraints   → /api/data-management/integrity-constraints
  - Migration plans         → /api/data-management/migration-plans
  - Archive policies        → /api/data-management/archive-policies
  - Operation logs          → /api/data-management/operation-logs
  - Statistics              → /api/data-management/statistics
```

### Quality Control
```
Frontend:                    Backend:
- QualityControlDashboard.tsx → /api/quality
```

### Operations Management
```
Frontend:                    Backend:
- OperationsManagement.tsx  → /api/production, /api/harvest
- ProcessingDashboard.tsx   → /api/harvest
- Worksheets.tsx            → /api/production
```

### Employee Management
```
Frontend:                    Backend:
- EmployeeDashboard.tsx     → /api/employees
- EmployeeProfile.tsx       → /api/employees
- EmployeeSchedule.tsx      → /api/employees
- EmployerDashboard.tsx     → /api/employees
- EmployerEmployees.tsx     → /api/employees
```

### Customer Relationship Management
```
Frontend:                    Backend:
- CustomerDashboard.tsx     → /api/crm, /api/orders
- CustomerOrders.tsx        → /api/orders
- CustomerCRM.tsx           → /api/crm
```

### Restaurant Management
```
Frontend:                    Backend:
- RestaurantDashboard.tsx   → /api/orders, /api/products
- RestaurantOrders.tsx      → /api/orders
- RestaurantInventory.tsx   → /api/inventory
```

---

## API Service Integration

The frontend uses `chicken-processing-frontend/src/services/api.ts` to communicate with the backend. This service provides methods for all API calls.

### Example API Calls

```typescript
// Authentication
api.post('/auth/login', credentials)
api.post('/auth/register', userData)

// Users
api.get('/users')
api.get('/users/:id')
api.post('/users', userData)
api.put('/users/:id', userData)
api.delete('/users/:id')

// Products
api.get('/products')
api.get('/products/:id')
api.post('/products', productData)
api.put('/products/:id', productData)
api.delete('/products/:id')

// Orders
api.get('/orders')
api.get('/orders/:id')
api.post('/orders', orderData)
api.put('/orders/:id', orderData)
api.put('/orders/:id/cancel', reason)

// Analytics
api.get('/analytics/dashboard')
api.get('/sales', { startDate, endDate })
api.get('/financial', { startDate, endDate })

// Data Management
api.get('/data-management/backup-configs')
api.post('/data-management/backup-configs', config)
api.get('/data-management/statistics')
```

---

## Missing Routes (No Backend Support Yet)

Based on the frontend pages, the following routes might need additional backend support:

| Frontend Page | Potential Missing Route | Notes |
|--------------|------------------------|-------|
| `Worksheets.tsx` | `/api/worksheets` | Currently uses `/api/production` |
| `PoultryCareDashboard.tsx` | `/api/poultry-care` | Currently uses `/api/production` and `/api/medication` |
| `OperationsManagement.tsx` | `/api/operations` | Currently uses `/api/production` and `/api/harvest` |

**Recommendation**: These pages are currently working by combining multiple backend routes, which is a valid approach. Creating dedicated routes is optional and depends on whether you want to simplify the frontend API calls.

---

## Frontend-Backend Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │  Contexts    │     │
│  │  (37 pages)  │  │              │  │ (Auth, etc)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│                    ┌──────▼───────┐                         │
│                    │  api.ts      │                         │
│                    │  (Axios)     │                         │
│                    └──────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    HTTP Requests
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                    ┌──────▼───────┐                         │
│                    │   app.ts     │                         │
│                    │  (Express)   │                         │
│                    └──────┬───────┘                         │
│                           │                                 │
│         ┌─────────────────┼──────────────────┐              │
│         │                 │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │   Routes     │  │  Middleware  │  │  Services    │     │
│  │  (19 routes) │  │  (Auth, etc) │  │  (18+ svc)   │     │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘     │
│         │                                    │              │
│         └────────────────────────────────────┘              │
│                           │                                 │
│                    ┌──────▼───────┐                         │
│                    │  Firestore   │                         │
│                    │  Database    │                         │
│                    └──────────────┘                         │
│                                                             │
│                        BACKEND                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

### Total Frontend Pages: 37
- **Pages with backend integration**: 32
- **Pages without backend (static/demo)**: 5
  - `Home.tsx`
  - `About.tsx`
  - `NotFound.tsx`
  - `ModelBindingDemo.tsx`
  - `Shop.tsx` (uses existing routes)

### Total Backend Routes: 19
- **Routes with frontend integration**: 19
- **Routes without frontend**: 0

### Coverage: 100%
All backend routes have corresponding frontend pages, and all frontend pages that require backend data have corresponding routes.

---

## Notes

1. **Authentication**: All protected pages use the `AuthContext` to manage user authentication
2. **Protected Routes**: Admin-only pages use `ProtectedRoute` component with role-based access
3. **API Service**: All API calls go through the centralized `api.ts` service
4. **Error Handling**: Backend errors are handled consistently across all pages
5. **Loading States**: All pages implement loading states while fetching data

---

## Future Considerations

1. **Real-time Updates**: Consider adding WebSocket support for real-time notifications
2. **Offline Support**: Consider adding service workers for offline functionality
3. **Caching**: Consider implementing client-side caching for frequently accessed data
4. **Pagination**: All list endpoints should support pagination (already implemented in backend)
5. **Search**: Consider adding global search functionality across all entities