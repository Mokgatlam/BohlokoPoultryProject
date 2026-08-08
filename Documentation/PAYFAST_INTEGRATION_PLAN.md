# PayFast Payment Gateway Integration Plan

**Date:** August 2026
**Status:** Approved — Ready to implement
**Scope:** Full PayFast integration replacing all existing payment methods

---

## 1. Overview

Replace the current manual payment methods (Cash, Bank Transfer, Mobile Money) with PayFast as the sole online payment gateway. Customers will be redirected to PayFast to complete payments via card, EFT, or mobile wallet. PayFast sends an IPN (Instant Payment Notification) webhook to the backend to confirm payment status.

**Flow:**
1. Customer places order → backend creates order + payment record
2. Backend returns PayFast checkout URL
3. Frontend redirects customer to PayFast
4. Customer completes payment on PayFast
5. PayFast redirects customer back to `return_url` (success/cancel page)
6. PayFast POSTs IPN to `notify_url` (backend webhook)
7. Backend verifies signature, updates payment + order status

---

## 2. Files to Create

### 2.1 `backend/services/PayFastService.js` (NEW)
PayFast gateway service — signature generation, ITN verification, checkout URL building.

```
Responsibilities:
- generateSignature(data, passphrase) → MD5 hash
- buildCheckoutUrl(paymentData) → full PayFast redirect URL
- verifyItn(postData) → { valid: boolean, data: object }
- getPaymentStatusFromItn(status) → mapped status string

Sandbox URL: https://sandbox.payfast.co.za/eng/process
Live URL:    https://www.payfast.co.za/eng/process

Fields passed to PayFast:
- merchant_id, merchant_key (from env)
- m_payment_id (order ID)
- amount, item_name (order number)
- return_url, cancel_url, notify_url
- name_first, name_last, email_address
- custom_str1 (userId for reference)
- signature (MD5 of sorted fields + passphrase)
```

### 2.2 `backend/routes/payfast.js` (NEW)
PayFast-specific API routes.

```
POST /api/payfast/init          → Create checkout URL for an order (authenticated)
POST /api/payfast/notify        → IPN webhook (NO auth — PayFast calls this)
GET  /api/payfast/status/:id    → Check payment status for an order (authenticated)
```

### 2.3 `pages/public/payment-success.html` (NEW)
Landing page after PayFast redirect (return_url for successful payment).
- Shows success message, order number, invoice link
- Auto-redirects to invoice after 10 seconds

### 2.4 `pages/public/payment-cancel.html` (NEW)
Landing page if customer cancels on PayFast (cancel_url).
- Shows cancellation message
- "Try Again" button returns to shop

### 2.5 `pages/public/payment-pending.html` (NEW)
Landing page for EFT payments awaiting clearance (PENDING status).
- Shows pending message, explains EFT can take 1-2 business days
- Link to invoice, link to shop

---

## 3. Files to Modify

### 3.1 `backend/.env` + `backend/.env.example`
Add PayFast environment variables:
```
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_MODE=sandbox
PAYFAST_RETURN_URL=http://localhost:5000/pages/public/payment-success.html
PAYFAST_CANCEL_URL=http://localhost:5000/pages/public/payment-cancel.html
PAYFAST_NOTIFY_URL=http://localhost:5000/api/payfast/notify
```

### 3.2 `backend/config/constants.js`
Update `PAYMENT_METHODS`:
```js
// Before: ['cash', 'bank_transfer', 'mobile_money', 'credit_card']
// After:  ['payfast']
PAYMENT_METHODS = ['payfast']
```

### 3.3 `backend/server.js`
Add PayFast route mount:
```js
{ path: '/api/payfast', module: './routes/payfast' }
```

### 3.4 `backend/services/OrderService.js`
Update `paymentStatus` logic in `create()`:
```js
// Before: paymentMethod === 'cash' ? 'Pending' : 'Unpaid'
// After:  'Pending' (always — PayFast handles the transition)
paymentStatus: 'Pending'
```

### 3.5 `pages/public/shop.html`
- Replace 3 payment method radio buttons with single PayFast option (card/EFT/wallet icons)
- Update `placeOrder()` to call `api.payfast.init(orderId)` after order creation
- Redirect to PayFast checkout URL returned by backend
- Handle errors (PayFast URL not returned)

### 3.6 `assets/js/api.js`
Add PayFast API methods:
```js
payfast: {
  init: (orderId) => api.post('/payfast/init', { orderId }),
  getStatus: (orderId) => api.get(`/payfast/status/${orderId}`),
}
```

### 3.7 `backend/seeds/01_seed_data.js`
Update existing seed orders to use `paymentMethod: 'payfast'` instead of old methods.

---

## 4. Implementation Order

| Step | Action | Files |
|------|--------|-------|
| 1 | Add env variables | `.env`, `.env.example` |
| 2 | Create PayFastService | `backend/services/PayFastService.js` |
| 3 | Create PayFast routes | `backend/routes/payfast.js` |
| 4 | Mount route in server | `backend/server.js` |
| 5 | Update constants | `backend/config/constants.js` |
| 6 | Update OrderService | `backend/services/OrderService.js` |
| 7 | Update shop frontend | `pages/public/shop.html` |
| 8 | Update api.js | `assets/js/api.js` |
| 9 | Create success page | `pages/public/payment-success.html` |
| 10 | Create cancel page | `pages/public/payment-cancel.html` |
| 11 | Create pending page | `pages/public/payment-pending.html` |
| 12 | Update seed data | `backend/seeds/01_seed_data.js` |
| 13 | Write unit tests | `backend/tests/PayFastService.test.js` |
| 14 | Run tests | `npx jest tests/PayFastService.test.js` |

---

## 5. Key Technical Details

### PayFast Signature Generation
```js
// 1. Filter empty values, exclude 'signature' field
// 2. Sort alphabetically by key
// 3. Concatenate as key=value& pairs, URL-encode values (use + for spaces)
// 4. Append &passphrase=<passphrase> if set
// 5. MD5 hash the result (lowercase hex)
```

### IPN Verification (5 steps)
1. Return 200 immediately to PayFast
2. Parse POST body
3. Rebuild param string from received fields (excluding signature)
4. Verify signature matches MD5 of param string + passphrase
5. POST param string to PayFast validate URL → confirm "VALID"

### Payment Status Mapping
| PayFast Status | System Status |
|----------------|---------------|
| COMPLETE | Paid |
| FAILED | Failed |
| PENDING | Pending |
| CANCELLED | Failed |
| REFUNDED | Refunded |

### Security
- IPN endpoint is unauthenticated (PayFast calls it) but verifies signature
- Validate source IP is from PayFast domains (sandbox.payfast.co.za, www.payfast.co.za, w1w/w2w.payfast.co.za)
- Amount verification: compare `amount_gross` with expected order total
- Idempotent: check if payment already processed before updating

---

## 6. Testing

### Unit Tests (`PayFastService.test.js`)
- Signature generation with known values
- Signature with passphrase
- Checkout URL building (sandbox vs live)
- ITN verification (valid signature)
- ITN verification (invalid signature)
- Status mapping (COMPLETE, FAILED, PENDING, CANCELLED)
- Empty value filtering in signature
- Special character handling in URL encoding

### Manual Test Flow (Sandbox)
1. Add product to cart → checkout → place order
2. Redirected to sandbox.payfast.co.za
3. Use test card: 4000 0000 0000 0002, expiry: any future, CVV: 123
4. Complete payment → redirected to payment-success.html
5. Check payment status in admin panel shows "Paid"
6. Check order paymentStatus updated to "Paid"
