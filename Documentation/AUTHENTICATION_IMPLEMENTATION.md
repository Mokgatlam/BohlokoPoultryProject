# Authentication System Implementation (UC-001 & UC-002)

## Overview
This document covers the implementation and gap fixes for **UC-001: User Registration** and **UC-002: User Login** use cases. All gaps identified during documentation analysis have been resolved, with full traceability between use cases (UC), functional requirements (FR), and code implementation.

---

## UC-001: User Registration

### Use Case Summary
| Field | Value |
|-------|-------|
| **Use Case** | UC-001 |
| **Functional Requirement** | FR-001 |
| **Actor** | Customer (Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution) |
| **Description** | New users can register for an account via the public registration form |
| **Precondition** | User does not have an existing account |
| **Postcondition** | User account created with "pending" status |

### Basic Flow
1. User navigates to registration page (`/register`)
2. User selects user type (Consumer, Restaurant, Retailer, Distributor, Farm Gate, Institution)
3. User provides required information (email, password, business details, address, contact)
4. System validates information and creates account with "pending" status
5. System sends confirmation email (via emailService)
6. Account status is set to "pending" until approved by Farm Manager
7. User is redirected to `/registration-pending` page

### Extensions
- **3a.** Email already exists: System displays error message
- **3b.** Invalid business registration: System prompts for correction with format requirements

### Gaps Identified & Fixed

#### Gap 1: Password Validation Mismatch
| Before | After |
|--------|-------|
| Frontend: 6 chars minimum | Frontend: 8 chars + uppercase + lowercase + number + special char |
| Backend: 8 chars + complexity rules | Backend: 8 chars + complexity rules (unchanged) |

**File:** `Register.tsx` — Frontend now validates: min 8 chars, uppercase (A-Z), lowercase (a-z), number (0-9), special char (@$!%*?&)

#### Gap 2: Simulated Confirmation Email
**Files:** `emailService.ts` (NEW), `authServiceV2.ts`

Created email service with:
- `sendRegistrationConfirmation()` — Consumer vs commercial user templates
- `sendAccountApprovalEmail()` — Notifies when approved
- `sendAccountRejectionEmail()` — Notifies with rejection reason
- Provider system via `EMAIL_PROVIDER` env: `mock` (default), `smtp`, `sendgrid`, `firebase`

#### Gap 3: Weak Business Registration Validation
**Files:** `validation.ts`, `UserValidator.ts`, `Register.tsx`

Three-layer validation: Frontend format check → Middleware cross-field validation → Joi schema pattern

| Field | Rules |
|-------|-------|
| Business Reg. Number | Pattern: `/^[A-Z0-9\-\/]{5,30}$/i`, min 5, max 30 |
| Tax ID | Pattern: `/^[A-Z0-9\-]{5,20}$/i`, min 5, max 20 |
| Business Name | Required for commercial users, min 2 chars |

#### Gap 4: Consumer Auto-Approval (Non-UC-001 Compliant)
**File:** `authServiceV2.ts`

Removed consumer auto-approval. ALL users now start with "pending" status per UC-001 specification.

#### Gap 5: Staff Member Actor Ambiguity
**Files:** `UseCase_Document.md`, `Requirements_Document.md`

UC-001 Actor clarified: "Customer types only. Staff Members created internally by Farm Manager."

#### Gap 6: Auto-Login After Registration Fails
**Files:** `AuthContext.tsx`, `Register.tsx`, `RegistrationPending.tsx` (NEW), `App.tsx`

Removed auto-login (account is pending). Register.tsx navigates to `/registration-pending`.

### Files Modified (UC-001)

| File | Changes |
|------|---------|
| `Register.tsx` | Password validation (8 chars + complexity), helper text, business validation |
| `RegistrationPending.tsx` | **NEW** — Pending approval confirmation page |
| `AuthContext.tsx` | Removed auto-login after registration |
| `App.tsx` | Added `/registration-pending` route |
| `emailService.ts` | **NEW** — Full email service with provider abstraction |
| `authServiceV2.ts` | Removed consumer auto-approval, integrated email service |
| `validation.ts` | Business reg. pattern validation, cross-field commercial validation |
| `UserValidator.ts` | Business reg. pattern validation (register schema) |
| `UseCase_Document.md` | Actor clarification, extension 3b details |
| `Requirements_Document.md` | FR-001 expanded to 9 requirements |
---

## UC-002: User Login

### Use Case Summary
| Field | Value |
|-------|-------|
| **Use Case** | UC-002 |
| **Functional Requirement** | FR-002 |
| **Actor** | All authenticated users |
| **Description** | Users log into the system with credentials |
| **Precondition** | User has an account (pending, approved, suspended, or rejected) |
| **Postcondition** | User session established with role-appropriate dashboard |

### Basic Flow
1. User enters email and password on login page (/login)
2. System validates credentials against stored bcrypt hash
3. System checks account status and lock status
4. System generates JWT authentication token (access + refresh)
5. System records login time and IP address
6. User is redirected to appropriate dashboard based on role/userType

### Extensions
- **2a.** Invalid credentials: System increments login attempts, locks for 30 minutes after 5 failures
- **2b.** Account not approved: System displays specific status message
- **2c.** Account locked: System displays lock message with unlock time

### Gaps Identified & Fixed

#### Gap 1: Generic Error Messages
**File:** Login.tsx

| Before | After |
|--------|-------|
| setError('Failed to sign in') for all errors | Shows specific backend message |

Now extracts: err?.response?.data?.message || err?.message

#### Gap 2: Vague Account Status Messages
**Files:** uthServiceV2.ts, uthControllerV2.ts

| Status | Error Message | HTTP Code | Code |
|--------|---------------|-----------|------|
| Pending | "Your account is pending approval by the Farm Manager..." | 403 | ACCOUNT_PENDING |
| Suspended | "Your account has been suspended..." | 403 | ACCOUNT_SUSPENDED |
| Rejected | "Your account registration was rejected..." | 403 | ACCOUNT_REJECTED |
| Inactive | "Your account is inactive..." | 401 | — |
| Locked | "Account temporarily locked..." | 423 | — |
| Invalid | "Invalid email or password" | 401 | — |

#### Gap 3: No "Forgot Password" Link
**File:** Login.tsx — Added "Forgot Password?" link below Sign In button

#### Gap 4: Dashboard Redirection Missing userType
**File:** App.tsx

getDefaultRoute() now checks both userProfile.role (staff) AND userProfile.userType (customers)

| Role/UserType | Redirect |
|---------------|----------|
| farm_manager / admin | /app |
| poultry_attendant | /app/production |
| processing_staff | /app/inventory |
| sales_assistant | /app/orders |
| consumer / retailer / distributor / farm_gate / institution | /app/customer-dashboard |
| restaurant | /app/restaurant-dashboard |

#### Gap 5: Documentation Missing Details
**Files:** UseCase_Document.md, Requirements_Document.md

UC-002 expanded: 6-step flow, 3 extensions with lockout duration, specific status messages.
FR-002 expanded from 6 to 10 requirements.

### Files Modified (UC-002)

| File | Changes |
|------|---------|
| Login.tsx | Specific error messages, Forgot Password link |
| App.tsx | Role+userType dashboard routing, registration-pending route |
| uthServiceV2.ts | Specific pending/suspended/rejected messages |
| uthControllerV2.ts | Status-specific HTTP 403 responses with error codes |
| UseCase_Document.md | UC-002 expanded with lockout and status details |
| Requirements_Document.md | FR-002 expanded to 10 requirements |
---

## Architecture

### Registration Flow
`
Register.tsx (Multi-step form)
  ├── Step 0: Account Info (email, password, userType)
  ├── Step 1: Business Details (conditional for commercial)
  ├── Step 2: Contact Info (address, phone)
  └── Step 3: Review & Submit
       ↓
AuthContext.register() → apiService.register()
       ↓
authControllerV2.register()
  ├── ModelBinder: Validate & transform DTO
  └── authServiceV2.registerUser()
       ├── Check email uniqueness
       ├── Create Firebase Auth user
       ├── Create Firestore user (status: pending)
       ├── Send confirmation email (emailService)
       └── Return tokens
       ↓
Register.tsx → navigate('/registration-pending')
`

### Login Flow
`
Login.tsx → AuthContext.login() → apiService.login()
       ↓
authControllerV2.login()
  └── authServiceV2.loginUser()
       ├── verifyCredentials() → bcrypt check
       ├── Check account locked (30min after 5 fails)
       ├── Check account status (pending/suspended/rejected)
       ├── Record login (IP + timestamp)
       └── Generate JWT (access + refresh)
       ↓
App.tsx.getDefaultRoute()
  ├── userProfile.role → staff routes
  └── userProfile.userType → customer routes
`

### Account Lockout
`
Failed login → user.recordFailedLogin()
  ├── loginAttempts += 1
  └── if >= 5 → lockedUntil = now + 30 min
       ↓
Next login → user.isAccountLocked()
  └── lockedUntil > now → 423 Locked response
`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register new account |
| POST | /api/auth/login | Public | Login with credentials |
| POST | /api/auth/refresh | Public | Refresh JWT tokens |
| POST | /api/auth/logout | Protected | Logout |
| POST | /api/auth/forgot-password | Public | Request password reset |
| POST | /api/auth/reset-password | Public | Reset with token |

### Error Response Format
`json
{
  "success": false,
  "message": "Your account is pending approval...",
  "code": "ACCOUNT_PENDING"
}
`

| HTTP Code | Error Code | Meaning |
|-----------|------------|---------|
| 400 | — | Validation failed |
| 401 | — | Invalid credentials / Inactive |
| 403 | ACCOUNT_PENDING | Pending approval |
| 403 | ACCOUNT_SUSPENDED | Suspended |
| 403 | ACCOUNT_REJECTED | Rejected |
| 409 | — | Email exists |
| 423 | — | Account locked (5 failed attempts) |

---

## Configuration

`env
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h
EMAIL_PROVIDER=mock         # mock, smtp, sendgrid, firebase
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`

---

## Future Enhancements
1. Real email provider integration (nodemailer/SendGrid)
2. Email confirmation link before activation
3. Remaining attempts warning before lockout
4. Self-service account unlock via email
5. Two-factor authentication
6. Session management and login audit trail

---

**Document Version**: 1.0
**Last Updated**: June 2026
**Use Cases**: UC-001 (Registration), UC-002 (Login)
**Requirements**: FR-001, FR-002