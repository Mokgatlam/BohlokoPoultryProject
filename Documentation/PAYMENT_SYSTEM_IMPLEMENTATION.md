# Payment System Implementation

**Last Updated:** August 2026  
**Status:** Production-ready (PayFast sandbox)

---

## Overview

The Bohloko Family Farm payment system uses **PayFast** as the sole online payment gateway. Customers are redirected to PayFast's secure checkout to pay via credit/debit card, EFT, or mobile wallet. PayFast sends an IPN (Instant Transaction Notification) webhook to confirm payment status.

---

## Architecture

```
Customer → Shop Checkout → Order Created (paymentStatus: Pending)
                                        ↓
                              POST /api/payfast/init → Builds signed PayFast URL
                                        ↓
                              Browser redirects to sandbox.payfast.co.za
                                        ↓
                              Customer pays (card/EFT/wallet)
                                        ↓
                    ┌───────────────────┴───────────────────┐
                    ↓                                       ↓
          payment-success.html                    payment-cancel.html
          (return_url)                            (cancel_url)
                    ↓
          PayFast POSTs IPN → /api/payfast/notify
                    ↓
          Backend verifies signature + confirms with PayFast
                    ↓
          Updates order.paymentStatus → Paid
```

---

## Environment Variables

Add to `backend/.env` (and `.env.example` for production):

```env
# PayFast Payment Gateway
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_MODE=sandbox
PAYFAST_RETURN_URL=http://localhost:5000/pages/public/payment-success.html
PAYFAST_CANCEL_URL=http://localhost:5000/pages/public/payment-cancel.html
PAYFAST_NOTIFY_URL=http://localhost:5000/api/payfast/notify
```

| Variable | Description |
|----------|-------------|
| `PAYFAST_MERCHANT_ID` | 8-character merchant ID from PayFast |
| `PAYFAST_MERCHANT_KEY` | Merchant key from PayFast |
| `PAYFAST_PASSPHRASE` | Passphrase set in PayFast dashboard (optional but recommended) |
| `PAYFAST_MODE` | `sandbox` for testing, `live` for production |
| `PAYFAST_RETURN_URL` | Redirect after successful payment |
| `PAYFAST_CANCEL_URL` | Redirect if customer cancels |
| `PAYFAST_NOTIFY_URL` | IPN webhook endpoint (PayFast POSTs here) |

### Sandbox vs Live URLs

| Environment | Checkout URL | ITN Validation URL |
|-------------|-------------|-------------------|
| Sandbox | `https://sandbox.payfast.co.za/eng/process` | `https://sandbox.payfast.co.za/eng/query/validate` |
| Live | `https://www.payfast.co.za/eng/process` | `https://www.payfast.co.za/eng/query/validate` |

### Sandbox Test Credentials

```
Merchant ID:  10000100
Merchant Key: 46f0cd694581a
Passphrase:   jt7NOE43FZPn
Test Buyer:   sbtu01@payfast.io / clientpass
Test Card:    4000 0000 0000 0002 (any future expiry, CVV 123)
```

---

## Files Reference

### Backend

| File | Purpose |
|------|---------|
| `backend/services/PayFastService.js` | Signature generation, checkout URL building, ITN verification, status mapping |
| `backend/routes/payfast.js` | API routes: `/init`, `/notify`, `/status/:orderId` |
| `backend/services/PaymentService.js` | Payment CRUD (create, process, refund, stats) |
| `backend/routes/payments.js` | Payment CRUD routes |
| `backend/config/constants.js` | `PAYMENT_METHODS = ['payfast']` |
| `backend/services/OrderService.js` | Creates orders with `paymentStatus: 'Pending'` |

### Frontend

| File | Purpose |
|------|---------|
| `pages/public/shop.html` | Checkout with PayFast redirect |
| `pages/public/payment-success.html` | Landing page after successful payment |
| `pages/public/payment-cancel.html` | Landing page if payment cancelled |
| `pages/public/payment-pending.html` | Landing page for EFT awaiting clearance |
| `assets/js/api.js` | `api.payfast.init()` and `api.payfast.getStatus()` |

### Tests

| File | Tests |
|------|-------|
| `backend/tests/PayFastService.test.js` | 30 tests — signature, ITN verification, status mapping, source validation |

---

## API Endpoints

### POST /api/payfast/init

Initialize PayFast checkout for an order.

**Auth:** Required (Bearer token)  
**Request Body:**
```json
{ "orderId": "uuid-of-order" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://sandbox.payfast.co.za/eng/process?merchant_id=...",
    "paymentId": "uuid-of-payment"
  }
}
```

**Business Rules:**
- Order must exist and not already be paid
- User must own the order (or be Farm Manager/Sales Assistant)
- Creates a payment record with status `Pending`

### POST /api/payfast/notify

ITN (Instant Transaction Notification) webhook from PayFast servers.

**Auth:** None (verified by signature)  
**Always returns HTTP 200** to prevent PayFast retries.

**Processing Steps:**
1. Verify MD5 signature matches
2. Confirm with PayFast server (`POST /eng/query/validate`)
3. Update payment status (Paid/Failed/Pending/Refunded)
4. Update order paymentStatus
5. Store full gateway response in `payments.gatewayResponse` JSON column

### GET /api/payfast/status/:orderId

Check payment status for an order.

**Auth:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "paymentStatus": "Paid",
    "orderStatus": "Confirmed",
    "payment": { ... }
  }
}
```

---

## PayFast Signature Algorithm

```
1. Remove empty values and 'signature' field
2. Sort remaining fields alphabetically by key
3. Concatenate as key=value pairs joined by &
4. URL-encode values (spaces as +, not %20)
5. Append &passphrase=<passphrase> if set
6. MD5 hash the result (lowercase hex)
```

**Node.js implementation:**
```js
const crypto = require('crypto');
const querystring = require('querystring');

function generateSignature(data, passphrase) {
  const filtered = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'signature' && value !== '' && value != null) {
      filtered.push({ key, value: String(value) });
    }
  }
  filtered.sort((a, b) => a.key.localeCompare(b.key));
  let paramString = filtered
    .map(({ key, value }) => `${key}=${querystring.escape(value)}`)
    .join('&');
  if (passphrase) {
    paramString += `&passphrase=${querystring.escape(passphrase)}`;
  }
  return crypto.createHash('md5').update(paramString).digest('hex');
}
```

---

## Payment Status Mapping

| PayFast Status | System Status | Description |
|----------------|---------------|-------------|
| `COMPLETE` | `Paid` | Payment successful |
| `FAILED` | `Failed` | Payment failed |
| `PENDING` | `Pending` | Payment pending (EFT awaiting clearance) |
| `CANCELLED` | `Failed` | Payment cancelled by buyer |
| `REFUNDED` | `Refunded` | Payment refunded |
| `STOPPED` | `Failed` | Subscription stopped |

---

## Database Schema

### payments table (relevant columns)

```sql
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  orderId VARCHAR(36) NOT NULL,
  transactionId VARCHAR(100),           -- PayFast pf_payment_id
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  method ENUM('payfast'),
  status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  gatewayResponse JSON,                  -- Full ITN payload from PayFast
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX (orderId),
  INDEX (transactionId)
);
```

### orders table (relevant columns)

```sql
paymentMethod ENUM('cash','bank_transfer','mobile_money','credit_card','debit_card','eft') DEFAULT 'cash'
paymentStatus ENUM('Pending','Paid','Refunded','Failed') DEFAULT 'Pending'
```

---

## Checkout Flow (Frontend)

1. Customer adds products to cart
2. Clicks "Proceed to Checkout" → login required
3. Fills delivery info, selects delivery option
4. Sees single payment option: **PayFast Secure Payment** (Card, EFT, or Mobile Wallet)
5. Clicks "Place Order"
6. `placeOrder()` calls `POST /api/orders` → order created
7. Then calls `POST /api/payfast/init` → receives checkout URL
8. Browser redirects to PayFast
9. Customer completes payment
10. PayFast redirects to `payment-success.html?id=<orderId>`
11. Page auto-redirects to invoice after 10 seconds

---

## IPN Verification (5 Steps)

```js
// 1. Verify signature matches
const calculated = generateSignature(postData, passphrase);
if (calculated !== postData.signature) return; // reject

// 2. Confirm with PayFast server
const response = await fetch('https://sandbox.payfast.co.za/eng/query/validate', {
  method: 'POST',
  body: paramBody
});
if (response !== 'VALID') return; // reject

// 3. Update payment record
await paymentService.updateStatus(paymentId, mappedStatus, pfPaymentId);

// 4. Store gateway response
await db('payments').where('id', paymentId).update({
  gatewayResponse: JSON.stringify(postData)
});

// 5. Update order paymentStatus
await db('orders').where('id', orderId).update({
  paymentStatus: mappedStatus
});
```

### Known PayFast IP Ranges

```
197.97.*.*   (primary)
41.0.*.*
196.216.*.*
102.130.*.*
```

---

## Testing

### Running PayFast Tests

```bash
cd backend
npx jest tests/PayFastService.test.js --no-coverage
```

**30 tests covering:**
- Signature generation (sorted fields, passphrase, empty values, special chars)
- Checkout data building (required fields, optional customer data)
- Checkout URL building (sandbox URL, signature in URL)
- ITN verification (valid/invalid signature, missing signature, invalid amount)
- Status mapping (COMPLETE, FAILED, PENDING, CANCELLED, REFUNDED, STOPPED)
- Source IP validation (PayFast ranges, IPv6 mapped, non-PayFast IPs)

### Manual Sandbox Test

1. Start server: `cd backend && node server.js`
2. Open `http://localhost:5000/pages/public/shop.html`
3. Add product to cart → checkout → place order
4. Redirected to `sandbox.payfast.co.za`
5. Enter test card: `4000 0000 0000 0002`, expiry: any future, CVV: `123`
6. Complete payment → redirected to `payment-success.html`
7. Check order status: `GET /api/payfast/status/<orderId>` → `Paid`

---

## Deployment (Production)

### Step 1: Update Environment Variables

```env
PAYFAST_MODE=live
PAYFAST_RETURN_URL=https://yourdomain.com/pages/public/payment-success.html
PAYFAST_CANCEL_URL=https://yourdomain.com/pages/public/payment-cancel.html
PAYFAST_NOTIFY_URL=https://yourdomain.com/api/payfast/notify
PAYFAST_MERCHANT_ID=<your-live-merchant-id>
PAYFAST_MERCHANT_KEY=<your-live-merchant-key>
PAYFAST_PASSPHRASE=<your-live-passphrase>
```

### Step 2: Update PayFast Dashboard

Set the **ITN URL** in your PayFast dashboard to:
```
https://yourdomain.com/api/payfast/notify
```

### Step 3: Enable Live Mode

Change `PAYFAST_MODE=live` and verify the merchant credentials are for the live account.

### Important: ITN URL Must Be HTTPS

PayFast requires the notify URL to be HTTPS in production. Ensure your deployment uses SSL.

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Signature verification | MD5 signature validated on every ITN |
| Server confirmation | ITN confirmed by POSTing back to PayFast validate URL |
| Idempotent processing | Check payment status before updating |
| Amount verification | `amount_gross` compared with expected order total |
| Source IP validation | Verify request originates from PayFast IP ranges |
| Auth on /init | Only authenticated users can initiate checkout |
| Ownership check | Users can only checkout their own orders |
| No secrets in frontend | All PayFast credentials stay in backend |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| PayFast redirects but doesn't come back | Check `PAYFAST_RETURN_URL` is correct and accessible |
| ITN not received | Check `PAYFAST_NOTIFY_URL`, ensure HTTPS in production, check firewall |
| Signature mismatch | Ensure `PAYFAST_PASSPHRASE` matches PayFast dashboard setting |
| Payment stays Pending | Check ITN processing logs — signature may be failing |
| Sandbox not working | Verify you're using sandbox credentials, not live |
| "Order already paid" | Order has `paymentStatus: Paid` — check ITN was processed |
