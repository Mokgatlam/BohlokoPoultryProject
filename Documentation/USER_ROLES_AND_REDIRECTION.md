# User Roles, Registration & Login Policy

## Overview
This document defines the complete user role system, access control, dashboard redirection logic, registration policy, and login policy for the Bohloko Family Farm Poultry Processing System.

---

## 1. User Types vs User Roles

The system has two classification systems: **User Types** (external customers) and **User Roles** (internal staff).

### 1.1 User Types (External Customers)
Registered through the **public registration form** (UC-001).

| UserType | Description | Business Fields Required |
|----------|-------------|--------------------------|
| consumer | Individual buyers | No |
| estaurant | Restaurants ordering products | Yes (business name, reg. number, tax ID) |
| etailer | Retail stores reselling | Yes |
| distributor | Wholesale distributors | Yes |
| arm_gate | Buyers at the farm gate | Yes |
| institution | Schools, hospitals, orgs | Yes |

**Backend Enum:** src/domain/enums.ts → UserType
**Domain Class:** CustomerUser extends User → role = UserRole.CUSTOMER

### 1.2 User Roles (Internal Staff)
Created **internally by Farm Manager** via admin panel.

| UserRole | Description | Default Dashboard |
|----------|-------------|-------------------|
| arm_manager | Full system administrator | /app |
| poultry_attendant | Live bird production | /app/production |
| processing_staff | Slaughtering & processing | /app/inventory |
| sales_assistant | Customer orders & sales | /app/orders |
| dmin | Technical administration | /app |
| customer | External user (mapped from UserType) | Varies by userType |

**Backend Enum:** src/domain/enums.ts → UserRole
**Domain Class:** FarmStaffUser extends User → stores role and department

### 1.3 Frontend App Roles
The frontend extends backend roles with UI-specific roles.

**Defined in:** src/config/navigation.tsx → AppRole type

---

## 2. Account Status Lifecycle

`
Registration → PENDING → Farm Manager → APPROVED → Active Login
                  ↓                          ↓
              REJECTED                  SUSPENDED → Re-activation
`

| Status | Can Login | Description |
|--------|-----------|-------------|
| pending | No | Awaiting Farm Manager approval |
| pproved | Yes | Active account with role-based access |
| suspended | No | Temporarily disabled |
| ejected | No | Registration denied |

### canLogin() Logic
`	ypescript
canLogin(): boolean {
  return this.isActive && !this.isAccountLocked() && this.accountStatus === AccountStatus.APPROVED;
}
`

### Account Lockout
- Failed login → loginAttempts += 1
- If >= 5 → lockedUntil = now + 30 minutes
- Successful login → loginAttempts = 0, lockedUntil = undefined

---

## 3. Dashboard Redirection (UC-002 Step 5)

After login, App.tsx → getDefaultRoute() determines the landing page:

| Role/UserType | Default Dashboard | Route |
|---------------|-------------------|-------|
| arm_manager / dmin | Main Dashboard | /app |
| poultry_attendant | Production | /app/production |
| processing_staff / staff | Inventory | /app/inventory |
| sales_assistant | Orders | /app/orders |
| employer / hr_manager / hr | Employer Dashboard | /app/employer-dashboard |
| consumer / etailer / distributor / arm_gate / institution | Customer Dashboard | /app/customer-dashboard |
| estaurant | Restaurant Dashboard | /app/restaurant-dashboard |

---

## 4. Page Access Control Matrix

### 4.1 Staff Module Access
| Page | Route | farm_manager | poultry_attendant | processing_staff | sales_assistant | customer | restaurant |
|------|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | /app | Y | Y | Y | Y | N | N |
| Production | /app/production | Y | Y | N | N | N | N |
| Inventory | /app/inventory | Y | N | Y | N | N | N |
| Orders | /app/orders | Y | N | N | Y | N | N |
| Products | /app/products | Y | N | Y | N | N | N |
| Users | /app/users | Y | N | N | N | N | N |
| Analytics | /app/analytics | Y | N | N | N | N | N |
| Production Analytics | /app/production-analytics | Y | Y | N | N | N | N |
| Settings | /app/settings | Y | N | N | N | N | N |
| System Logs | /app/system-logs | Y | N | N | N | N | N |
| API Keys | /app/api-keys | Y | N | N | N | N | N |
| Notifications | /app/notification-configs | Y | N | N | N | N | N |
| Poultry Care | /app/poultry-care | Y | Y | N | N | N | N |
| Operations | /app/operations | Y | N | N | N | N | N |
| Worksheets | /app/worksheets | Y | Y | Y | N | N | N |
| Processing | /app/processing | Y | N | Y | N | N | N |
| Inventory Analytics | /app/inventory-analytics | Y | N | Y | N | N | N |
| Quality Control | /app/quality-control | Y | N | Y | N | N | N |
| System Config | /app/system-configuration | Y | N | N | N | N | N |
| Data Management | /app/data-management | Y | N | N | N | N | N |

### 4.2 Customer Module Access
| Page | Route | consumer | restaurant | retailer | distributor | farm_gate | institution |
|------|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| Customer Dashboard | /app/customer-dashboard | Y | N | Y | Y | Y | Y |
| Customer Orders | /app/customer-orders | Y | N | Y | Y | Y | Y |
| Customer CRM | /app/customer-crm | Y | N | Y | Y | Y | Y |
| Customer Profile | /app/customer-profile | Y | N | Y | Y | Y | Y |
| Restaurant Dashboard | /app/restaurant-dashboard | N | Y | N | N | N | N |
| Restaurant Orders | /app/restaurant-orders | N | Y | N | N | N | N |
| Restaurant Inventory | /app/restaurant-inventory | N | Y | N | N | N | N |
| Restaurant Profile | /app/restaurant-profile | N | Y | N | N | N | N |

### 4.3 Employer Module Access
| Page | Route | employer | hr_manager | hr |
|------|-------|:---:|:---:|:---:|
| Employer Dashboard | /app/employer-dashboard | Y | Y | Y |
| Employees | /app/employer-employees | Y | Y | Y |
| Employer Profile | /app/employer-profile | Y | Y | Y |

### 4.4 Public Pages (No Auth Required)
| Page | Route |
|------|-------|
| Home | / |
| Shop | /shop |
| About | /about |
| Login | /login |
| Register | /register |
| Registration Pending | /registration-pending |

---

## 5. Registration Policy (UC-001 / FR-001)

### 5.1 Who Can Register
- **Public access:** Any person without an existing account
- **Available types:** Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution
- **Staff accounts:** NOT created through registration - created internally by Farm Manager

### 5.2 Registration Requirements

#### All Users
| Field | Rules |
|-------|-------|
| Email | Valid format, unique in system, required |
| Password | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (@$!%*?&) |
| User Type | One of: consumer, restaurant, retailer, distributor, farm_gate, institution |
| Address | Street (min 5), City (min 2), State (min 2), Country (min 2), Postal Code (min 3) |
| Phone | Valid format, min 10 digits |

#### Commercial Users (All except Consumer)
| Field | Rules |
|-------|-------|
| Business Name | Required, min 2 chars, max 100 chars |
| Business Registration Number | Optional; if provided: alphanumeric + hyphens + slashes, 5-30 chars |
| Tax ID | Optional; if provided: alphanumeric + hyphens, 5-20 chars |

### 5.3 Registration Flow
1. User fills form (4 steps: Account -> Business -> Contact -> Review)
2. Frontend validates (password complexity, email format, business format)
3. Backend validates (Joi schema + middleware cross-field validation)
4. Email uniqueness check - Error if exists (409)
5. Firebase Auth user created
6. Firestore user document created (accountStatus: pending)
7. Confirmation email sent (emailService)
8. User redirected to /registration-pending
9. Account waits for Farm Manager approval

### 5.4 Post-Registration
- All accounts start with pending status (no auto-approval)
- User sees Registration Received! Pending approval page
- Confirmation email sent with pending status notification
- Farm Manager approves via Users admin page (/app/users)
- Approval email sent to user
- User can then login

---

## 6. Login Policy (UC-002 / FR-002)

### 6.1 Login Requirements
| Field | Rules |
|-------|-------|
| Email | Registered email address |
| Password | Correct password matching bcrypt hash |

### 6.2 Login Flow
1. User enters email + password
2. Frontend sends to POST /api/auth/login
3. Backend AuthenticationService.verifyCredentials():
   a. Find user by email - Error if not found
   b. Check if account locked - Error if locked
   c. Check if account can login - Error if inactive/rejected/pending
   d. Verify password with bcrypt - Error if wrong
   e. If wrong: recordFailedLogin(), increment counter, lock at 5
4. Check account status:
   - PENDING  -> 403: Your account is pending approval...
   - SUSPENDED -> 403: Your account has been suspended...
   - REJECTED -> 403: Your account registration was rejected...
   - APPROVED -> Continue
5. Record successful login (timestamp + IP)
6. Generate JWT tokens (access: 1h, refresh: 7d)
7. Frontend stores token, sets user context
8. Redirect to role-appropriate dashboard

### 6.3 Error Responses
| Scenario | HTTP Code | Error Code | Message |
|----------|-----------|------------|---------|
| Invalid credentials | 401 | - | Invalid email or password |
| Account pending | 403 | ACCOUNT_PENDING | Your account is pending approval... |
| Account suspended | 403 | ACCOUNT_SUSPENDED | Your account has been suspended... |
| Account rejected | 403 | ACCOUNT_REJECTED | Your account registration was rejected... |
| Account inactive | 401 | - | Your account is inactive... |
| Account locked | 423 | - | Account temporarily locked... |
| Email exists (register) | 409 | - | User with this email already exists |
| Validation failed | 400 | - | Array of field-specific errors |

### 6.4 Account Lockout Policy
| Setting | Value |
|---------|-------|
| Max failed attempts | 5 |
| Lock duration | 30 minutes |
| Reset on success | Yes (loginAttempts = 0, lockedUntil = undefined) |

### 6.5 Token Policy
| Token | Expiry | Payload |
|-------|--------|---------|
| Access Token | 1 hour (configurable via JWT_EXPIRES_IN) | uid, email, userType, firebaseUid |
| Refresh Token | 7 days | uid, firebaseUid |

---

## 7. Backend Authorization Middleware

### 7.1 Middleware Functions
| Middleware | Purpose |
|------------|---------|
| authenticate | Verifies JWT token, loads user from Firestore |
| authorizeAdmin | Requires userType === DISTRIBUTOR (admin function) |
| authorize(...types) | Requires user userType in allowed list |
| optionalAuth | Attaches user if token present, continues if not |
| validateRegistration | Joi schema validation + cross-field business validation |
| validateLogin | Joi schema validation for login |
| authLimiter | Rate limiting: 100 requests per 15 minutes |

### 7.2 Frontend Protection
ProtectedRoute component checks:
1. User is authenticated (token exists, user loaded)
2. User role is in allowedRoles array (if specified)
3. If not: shows Access Denied with role info

---

## 8. File Reference

### Backend
| File | Purpose |
|------|---------|
| src/domain/enums.ts | UserRole, UserType, AccountStatus enums |
| src/domain/User.ts | User, FarmStaffUser, CustomerUser classes |
| src/models/User.ts | User interfaces, Firestore converters |
| src/services/authServiceV2.ts | Registration and login logic |
| src/services/implementations/AuthenticationService.ts | Credential verification, lockout |
| src/services/emailService.ts | Email notifications |
| src/middleware/auth.ts | JWT authentication, authorization |
| src/middleware/validation.ts | Joi schemas for registration/login |
| src/dto/validators/UserValidator.ts | SOLID validator for DTOs |
| src/controllers/authControllerV2.ts | HTTP request handling |

### Frontend
| File | Purpose |
|------|---------|
| src/config/navigation.tsx | Navigation items, role mapping, AppRole type |
| src/components/ProtectedRoute.tsx | Route-level role enforcement |
| src/components/Layout.tsx | Navigation menu rendering |
| src/contexts/AuthContext.tsx | Auth state, login/register/logout |
| src/pages/Login.tsx | Login form |
| src/pages/Register.tsx | Registration form (4-step wizard) |
| src/pages/RegistrationPending.tsx | Pending approval page |
| src/App.tsx | Routes, getDefaultRoute() redirection |

---

**Document Version**: 1.0
**Last Updated**: June 2026
**Traces To**: UC-001, UC-002, FR-001, FR-002, FR-003