# Bohloko Family Farm — Sample User Login Details

## Overview

This document provides all sample/test user credentials for the **Bohloko Family Farm Poultry Processing System**. Use these accounts to test login, role-based access, and dashboard redirection.

---

## Quick Reference — Login Credentials

> **Default Password for ALL accounts:** `Test@123456`

| # | User Type | Email | Role | Dashboard | Status |
|---|-----------|-------|------|-----------|--------|
| 1 | **Distributor (Admin)** | `admin@bohloko.co.za` | Admin | `/app` | Approved |
| 2 | Consumer | `consumer@bohloko.co.za` | Customer | `/app` | Approved |
| 3 | Restaurant | `restaurant@bohloko.co.za` | Customer | `/app` | Approved |
| 4 | Retailer | `retailer@bohloko.co.za` | Customer | `/app` | Approved |
| 5 | Farm Gate | `farmgate@bohloko.co.za` | Customer | `/app` | Approved |
| 6 | Institution | `institution@bohloko.co.za` | Customer | `/app` | Approved |

---

## Detailed User Profiles

### 1. Admin User (Distributor)

| Field | Value |
|-------|-------|
| **Email** | `admin@bohloko.co.za` |
| **Password** | `Test@123456` |
| **User Type** | `distributor` |
| **Role** | `admin` |
| **Business Name** | Bohloko Poultry Admin |
| **Business Reg No** | REG2024000 |
| **Tax ID** | TAX900000 |
| **Phone** | +27 82 000 0000 |
| **Address** | 1 Admin Drive, Pretoria, Gauteng, South Africa, 0001 |
| **Certifications** | HACCP Certified, Halal |
| **Dashboard** | `/app` (Full admin access) |

> **Note:** This is the primary admin account. It has `userType = distributor` which grants admin privileges via the `authorizeAdmin` middleware.

---

### 2. Consumer User

| Field | Value |
|-------|-------|
| **Email** | `consumer@bohloko.co.za` |
| **Password** | `Test@123456` |
| **User Type** | `consumer` |
| **Business Name** | John Consumer |
| **Phone** | +27 82 111 1111 |
| **Address** | 123 Main St, Johannesburg, Gauteng, South Africa, 2000 |
| **Business Fields** | Not required |
| **Dashboard** | `/app` |

---

### 3. Restaurant User

| Field | Value |
|-------|-------|
| **Email** | `restaurant@bohloko.co.za` |
| **Password** | `Test@123456` |
| **User Type** | `restaurant` |
| **Business Name** | Golden Chicken Restaurant |
| **Business Reg No** | REG2024001 |
| **Tax ID** | TAX900001 |
| **Phone** | +27 82 222 2222 |
| **Website** | https://goldenchicken.co.za |
| **Address** | 45 Restaurant Rd, Pretoria, Gauteng, South Africa, 0002 |
| **Certifications** | HACCP Certified, Halal |
| **Dashboard** | `/app` |

---

### 4. Retailer User

| Field | Value |
|-------|-------|
| **Email** | `retailer@bohloko.co.za` |
| **Password** | `Test@123456` |
| **User Type** | `retailer` |
| **Business Name** | FreshMart Retail |
| **Business Reg No** | REG2024002 |
| **Tax ID** | TAX900002 |
| **Phone** | +27 82 333 3333 |
| **Address** | 78 Commerce Ave, Sandton, Gauteng, South Africa, 2196 |
| **Certifications** | ISO 22000, Organic |
| **Dashboard** | `/app` |

---

### 5. Farm Gate User

| Field | Value |
|-------|-------|
| **Email** | `farmgate@bohloko.co.za` |
| **Password** | `Test@123456` |
| **User Type** | `farm_gate` |
| **Business Name** | Bohloko Farm Gate Sales |
| **Business Reg No** | REG2024004 |
| **Tax ID** | TAX900004 |
| **Phone** | +27 82 555 5555 |
| **Address** | 1 Farm Road, Pretoria North, Gauteng, South Africa, 0182 |
| **Certifications** | Halal, Organic |
| **Dashboard** | `/app` |

---

### 6. Institution User

| Field | Value |
|-------|-------|
| **Email** | `institution@bohloko.co.za` |
| **Password** | `Test@123456` |
| **User Type** | `institution` |
| **Business Name** | Gauteng Provincial Hospital |
| **Business Reg No** | REG2024005 |
| **Tax ID** | TAX900005 |
| **Phone** | +27 82 666 6666 |
| **Address** | 50 Hospital St, Pretoria, Gauteng, South Africa, 0001 |
| **Certifications** | SABS Certified |
| **Dashboard** | `/app` |

---

## Internal Staff Roles (Created by Farm Manager)

These users are **not registered via the public form**. They are created internally by the Farm Manager through the admin panel (`/app/users`).

| Role | Value | Default Dashboard |
|------|-------|-------------------|
| `farm_manager` | Full system administrator | `/app` |
| `poultry_attendant` | Live bird production | `/app/production` |
| `processing_staff` | Slaughtering & processing | `/app/inventory` |
| `sales_assistant` | Customer orders & sales | `/app/orders` |
| `admin` | Technical administration | `/app` |

---

## Emulator-Only Users (Firebase Emulator)

| Email | User Type | Role | Status |
|-------|-----------|------|--------|
| `admin@bohlokofamilyfarm.com` | `admin` | admin | `approved` |

> These users exist only in the Firebase Emulator (`localhost:8080`). Initialize with:
> ```bash
> cd chicken-processing-backend
> npm run emulators:init
> ```

---

## Why Admin Login May Fail

If you are unable to log in as an Admin, check the following:

### 1. Account Not Approved (Most Common)
Newly registered accounts have `accountStatus = "pending"`. They **cannot log in** until approved by a Farm Manager.

**Fix:** Open Firebase Emulator UI at `http://localhost:4000` → Firestore → `users` collection → find the admin user → set `profile.accountStatus` to `"approved"`.

### 2. Account Locked (Too Many Failed Attempts)
After **5 failed login attempts**, the account is locked for **30 minutes**.

**Fix:** Wait 30 minutes, OR in Firestore reset `loginAttempts` to `0` and remove `lockedUntil`.

### 3. Account Suspended or Rejected
Check that `accountStatus` is `"approved"` (not `"suspended"` or `"rejected"`).

### 4. Wrong Credentials
Ensure you are using:
- **Email:** `admin@bohloko.co.za`
- **Password:** `Test@123456`

> **Important:** The admin account uses `userType = "distributor"`. The backend `authorizeAdmin` middleware checks for `userType === DISTRIBUTOR` to grant admin access.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/refresh` | Refresh JWT tokens |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user profile |

### Login Request Example

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@bohloko.co.za",
  "password": "Test@123456"
}
```

### Successful Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt_access_token>",
    "refreshToken": "<jwt_refresh_token>",
    "user": {
      "email": "admin@bohloko.co.za",
      "userType": "distributor",
      "role": "admin",
      "accountStatus": "approved"
    }
  }
}
```

---

## Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 8 characters |
| Uppercase letter | Required (A-Z) |
| Lowercase letter | Required (a-z) |
| Number | Required (0-9) |
| Special character | Required (@$!%*?&) |

The default password `Test@123456` satisfies all requirements.

---

## Running the Seed Script

To create all test users automatically:

```bash
# 1. Start the backend
cd chicken-processing-backend
npm run dev

# 2. In a separate terminal, run the seeder
node seed-test-users.js
```

The seeder will:
1. Register all 6 test users
2. Login as admin
3. Approve all pending users
4. Print a summary of all credentials

---

## Account Status Lifecycle

```
Registration → PENDING → Farm Manager → APPROVED → Active Login
                   ↓                          ↓
               REJECTED                  SUSPENDED → Re-activation
```

| Status | Can Login | Description |
|--------|-----------|-------------|
| `pending` | No | Awaiting Farm Manager approval |
| `approved` | Yes | Active account with role-based access |
| `suspended` | No | Temporarily disabled |
| `rejected` | No | Registration denied |

---

## Account Lockout Policy

| Setting | Value |
|---------|-------|
| Max failed attempts | 5 |
| Lock duration | 30 minutes |
| Reset on successful login | Yes |

---

## Error Response Codes

| HTTP Code | Error Code | Meaning |
|-----------|------------|---------|
| 400 | — | Validation failed |
| 401 | — | Invalid credentials / Inactive account |
| 403 | `ACCOUNT_PENDING` | Pending approval |
| 403 | `ACCOUNT_SUSPENDED` | Account suspended |
| 403 | `ACCOUNT_REJECTED` | Registration rejected |
| 409 | — | Email already exists |
| 423 | — | Account locked (5+ failed attempts) |

---

## Troubleshooting Checklist

- [ ] Backend is running (`npm run dev` in `chicken-processing-backend/`)
- [ ] Test users have been seeded (`node seed-test-users.js`)
- [ ] Admin account status is `approved` (not `pending`)
- [ ] Correct email and password are entered (case-sensitive)
- [ ] Account is not locked (wait 30 min or check Firestore `loginAttempts`)
- [ ] Frontend is running (`npm start` in `chicken-processing-frontend/`)
- [ ] Firebase emulators are running if using emulator mode

---

## File References

| File | Purpose |
|------|---------|
| `seed-test-users.js` | Registers and approves all test users |
| `chicken-processing-backend/initialize-emulator.js` | Seeds emulator-only data |
| `chicken-processing-backend/src/services/authServiceV2.ts` | Registration & login logic |
| `chicken-processing-backend/src/controllers/authControllerV2.ts` | Login/register API handlers |
| `chicken-processing-backend/src/middleware/auth.ts` | JWT auth & admin middleware |
| `chicken-processing-backend/src/domain/enums.ts` | UserRole, UserType, AccountStatus enums |
| `chicken-processing-frontend/src/pages/Login.tsx` | Frontend login form |
| `chicken-processing-frontend/src/contexts/AuthContext.tsx` | Frontend auth state |
| `chicken-processing-frontend/src/App.tsx` | Route definitions & redirection |

---

**Document Version:** 1.0 | **Last Updated:** June 2026
**System:** Bohloko Family Farm Poultry Processing System
**Seed Script:** `seed-test-users.js` | **Backend:** `http://localhost:3001`
