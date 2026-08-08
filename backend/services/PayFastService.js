/**
 * PayFast Payment Gateway Service
 * ================================
 *
 * Handles PayFast integration: signature generation, checkout URL building,
 * ITN (Instant Transaction Notification) verification, and status mapping.
 *
 * PayFast Flow:
 *   1. Build checkout form data with order details
 *   2. Generate MD5 signature from sorted fields + passphrase
 *   3. Redirect customer to PayFast URL with form data
 *   4. PayFast POSTs ITN to notify_url after payment
 *   5. Verify ITN signature and amount, update order/payment status
 *
 * Signature Algorithm:
 *   - Filter out empty values
 *   - Sort alphabetically by key
 *   - Concatenate as key=value& pairs (URL-encoded, spaces as +)
 *   - Append &passphrase=<passphrase>
 *   - MD5 hash the result
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const querystring = require('querystring');

class PayFastService {
  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    this.passphrase = process.env.PAYFAST_PASSPHRASE || '';
    this.mode = process.env.PAYFAST_MODE || 'sandbox';
    this.returnUrl = process.env.PAYFAST_RETURN_URL;
    this.cancelUrl = process.env.PAYFAST_CANCEL_URL;
    this.notifyUrl = process.env.PAYFAST_NOTIFY_URL;

    this.urls = {
      sandbox: 'https://sandbox.payfast.co.za/eng/process',
      live: 'https://www.payfast.co.za/eng/process'
    };

    this.validateUrls = {
      sandbox: 'https://sandbox.payfast.co.za/eng/query/validate',
      live: 'https://www.payfast.co.za/eng/query/validate'
    };

    this.validDomains = [
      'www.payfast.co.za',
      'w1w.payfast.co.za',
      'w2w.payfast.co.za',
      'sandbox.payfast.co.za'
    ];
  }

  /**
   * Generate PayFast MD5 signature from data fields.
   *
   * Algorithm:
   *   1. Remove empty values and 'signature' field
   *   2. Sort alphabetically by key
   *   3. Concatenate as URL-encoded key=value pairs (spaces as +)
   *   4. Append passphrase if set
   *   5. MD5 hash
   */
  generateSignature(data) {
    const filtered = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'signature' && value !== '' && value !== undefined && value !== null) {
        filtered.push({ key, value: String(value) });
      }
    }

    filtered.sort((a, b) => a.key.localeCompare(b.key));

    let paramString = filtered
      .map(({ key, value }) => `${key}=${querystring.escape(value)}`)
      .join('&');

    if (this.passphrase) {
      paramString += `&passphrase=${querystring.escape(this.passphrase)}`;
    }

    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  /**
   * Build the full PayFast checkout URL with signed form data.
   */
  buildCheckoutData(order) {
    const data = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: this.returnUrl,
      cancel_url: this.cancelUrl,
      notify_url: this.notifyUrl,
      m_payment_id: order.orderId,
      amount: Number(order.total).toFixed(2),
      item_name: order.orderNumber || `Order ${order.orderId}`,
      item_description: `Bohloko Family Farm - ${order.orderNumber || order.orderId}`
    };

    if (order.customer) {
      if (order.customer.firstName) data.name_first = order.customer.firstName;
      if (order.customer.lastName) data.name_last = order.customer.lastName;
      if (order.customer.email) data.email_address = order.customer.email;
    }

    if (order.userId) {
      data.custom_str1 = String(order.userId);
    }

    data.signature = this.generateSignature(data);
    return data;
  }

  /**
   * Build the full redirect URL with query parameters.
   */
  buildCheckoutUrl(order) {
    const baseUrl = this.urls[this.mode] || this.urls.sandbox;
    const data = this.buildCheckoutData(order);
    const queryString = querystring.stringify(data);
    return `${baseUrl}?${queryString}`;
  }

  /**
   * Verify ITN (Instant Transaction Notification) from PayFast.
   * Returns { valid, data, error }
   */
  verifyItn(postData) {
    try {
      const receivedSignature = postData.signature;
      if (!receivedSignature) {
        return { valid: false, data: postData, error: 'No signature in ITN data' };
      }

      const calculatedSignature = this.generateSignature(postData);
      if (calculatedSignature !== receivedSignature) {
        return { valid: false, data: postData, error: 'Signature mismatch' };
      }

      const amountGross = parseFloat(postData.amount_gross);
      if (isNaN(amountGross) || amountGross <= 0) {
        return { valid: false, data: postData, error: 'Invalid amount_gross' };
      }

      const paymentStatus = this.mapStatus(postData.payment_status);

      return {
        valid: true,
        data: {
          paymentId: postData.m_payment_id,
          pfPaymentId: postData.pf_payment_id,
          status: paymentStatus,
          rawStatus: postData.payment_status,
          amountGross,
          amountFee: parseFloat(postData.amount_fee || '0'),
          amountNet: parseFloat(postData.amount_net || '0'),
          emailAddress: postData.email_address,
          customStr1: postData.custom_str1 || '',
          customInt1: postData.custom_int1 || ''
        }
      };
    } catch (error) {
      return { valid: false, data: postData, error: error.message };
    }
  }

  /**
   * Validate that the ITN request came from PayFast.
   * Checks the source IP address against known PayFast domains.
   */
  validateSource(ipAddress) {
    if (!ipAddress) return false;
    const cleanIp = ipAddress.replace('::ffff:', '');
    const validRanges = [
      '197.97.', '41.0.', '196.216.', '102.130.'
    ];
    return validRanges.some(range => cleanIp.startsWith(range));
  }

  /**
   * Confirm ITN with PayFast server (POST param string to validate URL).
   * Returns true if PayFast responds with "VALID".
   */
  async confirmWithServer(postData) {
    const filtered = {};
    for (const [key, value] of Object.entries(postData)) {
      if (key !== 'signature' && value !== '' && value !== undefined) {
        filtered[key] = value;
      }
    }

    const sortedKeys = Object.keys(filtered).sort();
    const paramParts = sortedKeys.map(key =>
      `${key}=${querystring.escape(String(filtered[key]))}`
    );
    const paramBody = paramParts.join('&');

    const validateUrl = this.validateUrls[this.mode] || this.validateUrls.sandbox;

    return new Promise((resolve) => {
      const url = new URL(validateUrl);
      const reqModule = url.protocol === 'https:' ? https : http;

      const req = reqModule.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(paramBody)
          }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            resolve(body.trim() === 'VALID');
          });
        }
      );

      req.on('error', () => resolve(false));
      req.write(paramBody);
      req.end();
    });
  }

  /**
   * Map PayFast payment_status to system payment status.
   */
  mapStatus(pfStatus) {
    const statusMap = {
      'COMPLETE': 'Paid',
      'FAILED': 'Failed',
      'PENDING': 'Pending',
      'CANCELLED': 'Failed',
      'REFUNDED': 'Refunded',
      'STOPPED': 'Failed'
    };
    return statusMap[pfStatus] || 'Pending';
  }

  /**
   * Get the checkout URL for the current mode.
   */
  getCheckoutUrl() {
    return this.urls[this.mode] || this.urls.sandbox;
  }

  /**
   * Get the ITN validation URL for the current mode.
   */
  getValidateUrl() {
    return this.validateUrls[this.mode] || this.validateUrls.sandbox;
  }
}

module.exports = PayFastService;
