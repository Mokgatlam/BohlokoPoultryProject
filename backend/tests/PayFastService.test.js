/**
 * PayFastService Unit Tests
 * =========================
 *
 * Tests for PayFast payment gateway integration:
 *   - Signature generation with and without passphrase
 *   - Checkout data/URL building
 *   - ITN verification (valid and invalid signatures)
 *   - Payment status mapping
 *   - Source IP validation
 */

const crypto = require('crypto');
const querystring = require('querystring');

// Set env vars before requiring the service
process.env.PAYFAST_MERCHANT_ID = '10000100';
process.env.PAYFAST_MERCHANT_KEY = '46f0cd694581a';
process.env.PAYFAST_PASSPHRASE = 'jt7NOE43FZPn';
process.env.PAYFAST_MODE = 'sandbox';
process.env.PAYFAST_RETURN_URL = 'http://localhost:5000/pages/public/payment-success.html';
process.env.PAYFAST_CANCEL_URL = 'http://localhost:5000/pages/public/payment-cancel.html';
process.env.PAYFAST_NOTIFY_URL = 'http://localhost:5000/api/payfast/notify';

const PayFastService = require('../services/PayFastService');

describe('PayFastService', () => {
  let service;

  beforeEach(() => {
    service = new PayFastService();
  });

  describe('generateSignature', () => {
    it('should generate correct MD5 signature from sorted fields', () => {
      const data = {
        merchant_id: '10000100',
        merchant_key: '46f0cd694581a',
        amount: '100.00',
        item_name: 'Test Order'
      };
      const sig = service.generateSignature(data);
      expect(typeof sig).toBe('string');
      expect(sig.length).toBe(32); // MD5 hex length
    });

    it('should produce same signature for same input', () => {
      const data = { amount: '50.00', item_name: 'Order #1', merchant_id: '10000100' };
      const sig1 = service.generateSignature(data);
      const sig2 = service.generateSignature(data);
      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures when passphrase changes', () => {
      const data = { amount: '100.00', item_name: 'Test' };
      const sig1 = service.generateSignature(data);

      const originalPassphrase = process.env.PAYFAST_PASSPHRASE;
      process.env.PAYFAST_PASSPHRASE = 'different_passphrase';
      const service2 = new PayFastService();
      const sig2 = service2.generateSignature(data);
      process.env.PAYFAST_PASSPHRASE = originalPassphrase;

      expect(sig1).not.toBe(sig2);
    });

    it('should exclude empty string values from signature', () => {
      const dataWithEmpty = { amount: '100.00', item_name: 'Test', description: '' };
      const dataWithout = { amount: '100.00', item_name: 'Test' };
      const sig1 = service.generateSignature(dataWithEmpty);
      const sig2 = service.generateSignature(dataWithout);
      expect(sig1).toBe(sig2);
    });

    it('should exclude signature field from calculation', () => {
      const data = { amount: '100.00', item_name: 'Test', signature: 'should_be_ignored' };
      const sigWithout = service.generateSignature({ amount: '100.00', item_name: 'Test' });
      const sigWith = service.generateSignature(data);
      expect(sigWith).toBe(sigWithout);
    });

    it('should handle special characters in values', () => {
      const data = { item_name: 'Chicken & Eggs (Special)', amount: '100.00' };
      const sig = service.generateSignature(data);
      expect(sig.length).toBe(32);
    });

    it('should handle URL-unsafe characters in passphrase', () => {
      process.env.PAYFAST_PASSPHRASE = 'test+pass phrase&more';
      const sig = service.generateSignature({ amount: '100.00' });
      process.env.PAYFAST_PASSPHRASE = 'jt7NOE43FZPn';
      expect(sig.length).toBe(32);
    });

    it('should sort fields alphabetically for signature', () => {
      const data1 = { amount: '100.00', item_name: 'Test', merchant_id: '10000100' };
      const data2 = { merchant_id: '10000100', amount: '100.00', item_name: 'Test' };
      expect(service.generateSignature(data1)).toBe(service.generateSignature(data2));
    });
  });

  describe('buildCheckoutData', () => {
    it('should include all required PayFast fields', () => {
      const order = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        total: 250.00,
        userId: 'user-456',
        customer: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' }
      };
      const data = service.buildCheckoutData(order);

      expect(data.merchant_id).toBe('10000100');
      expect(data.merchant_key).toBe('46f0cd694581a');
      expect(data.return_url).toContain('payment-success.html');
      expect(data.cancel_url).toContain('payment-cancel.html');
      expect(data.notify_url).toContain('/api/payfast/notify');
      expect(data.m_payment_id).toBe('order-123');
      expect(data.amount).toBe('250.00');
      expect(data.item_name).toBe('ORD-001');
      expect(data.name_first).toBe('John');
      expect(data.name_last).toBe('Doe');
      expect(data.email_address).toBe('john@test.com');
      expect(data.custom_str1).toBe('user-456');
      expect(data.signature).toBeDefined();
    });

    it('should format amount to 2 decimal places', () => {
      const order = { orderId: 'o1', total: 100, userId: 'u1', customer: {} };
      const data = service.buildCheckoutData(order);
      expect(data.amount).toBe('100.00');
    });

    it('should work without optional customer fields', () => {
      const order = { orderId: 'o1', total: 50, userId: 'u1' };
      const data = service.buildCheckoutData(order);
      expect(data.m_payment_id).toBe('o1');
      expect(data.signature).toBeDefined();
    });
  });

  describe('buildCheckoutUrl', () => {
    it('should build sandbox URL when mode is sandbox', () => {
      const order = { orderId: 'o1', total: 100, userId: 'u1', customer: {} };
      const url = service.buildCheckoutUrl(order);
      expect(url).toContain('sandbox.payfast.co.za');
      expect(url).toContain('m_payment_id=o1');
    });

    it('should contain signature in URL', () => {
      const order = { orderId: 'o1', total: 100, userId: 'u1', customer: {} };
      const url = service.buildCheckoutUrl(order);
      expect(url).toContain('signature=');
    });
  });

  describe('verifyItn', () => {
    it('should verify a valid ITN with correct signature', () => {
      const itnData = {
        m_payment_id: 'order-123',
        pf_payment_id: 'pf-456',
        payment_status: 'COMPLETE',
        amount_gross: '250.00',
        amount_fee: '-5.00',
        amount_net: '245.00',
        email_address: 'buyer@test.com',
        custom_str1: 'user-789'
      };

      // Generate the expected signature
      itnData.signature = service.generateSignature(itnData);

      const result = service.verifyItn(itnData);
      expect(result.valid).toBe(true);
      expect(result.data.paymentId).toBe('order-123');
      expect(result.data.pfPaymentId).toBe('pf-456');
      expect(result.data.status).toBe('Paid');
      expect(result.data.amountGross).toBe(250.00);
    });

    it('should reject ITN with invalid signature', () => {
      const itnData = {
        m_payment_id: 'order-123',
        payment_status: 'COMPLETE',
        amount_gross: '250.00',
        signature: 'invalid_signature_hash'
      };
      const result = service.verifyItn(itnData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Signature mismatch');
    });

    it('should reject ITN without signature', () => {
      const itnData = {
        m_payment_id: 'order-123',
        payment_status: 'COMPLETE',
        amount_gross: '250.00'
      };
      const result = service.verifyItn(itnData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No signature');
    });

    it('should reject ITN with invalid amount', () => {
      const itnData = {
        m_payment_id: 'order-123',
        payment_status: 'COMPLETE',
        amount_gross: 'invalid',
        signature: 'anything'
      };
      const result = service.verifyItn(itnData);
      expect(result.valid).toBe(false);
    });
  });

  describe('mapStatus', () => {
    it('should map COMPLETE to Paid', () => {
      expect(service.mapStatus('COMPLETE')).toBe('Paid');
    });

    it('should map FAILED to Failed', () => {
      expect(service.mapStatus('FAILED')).toBe('Failed');
    });

    it('should map PENDING to Pending', () => {
      expect(service.mapStatus('PENDING')).toBe('Pending');
    });

    it('should map CANCELLED to Failed', () => {
      expect(service.mapStatus('CANCELLED')).toBe('Failed');
    });

    it('should map REFUNDED to Refunded', () => {
      expect(service.mapStatus('REFUNDED')).toBe('Refunded');
    });

    it('should map STOPPED to Failed', () => {
      expect(service.mapStatus('STOPPED')).toBe('Failed');
    });

    it('should default unknown status to Pending', () => {
      expect(service.mapStatus('UNKNOWN')).toBe('Pending');
    });
  });

  describe('validateSource', () => {
    it('should accept valid PayFast IP ranges', () => {
      expect(service.validateSource('197.97.1.1')).toBe(true);
      expect(service.validateSource('41.0.1.1')).toBe(true);
      expect(service.validateSource('196.216.1.1')).toBe(true);
      expect(service.validateSource('102.130.1.1')).toBe(true);
    });

    it('should accept IPv6 mapped addresses', () => {
      expect(service.validateSource('::ffff:197.97.1.1')).toBe(true);
    });

    it('should reject non-PayFast IPs', () => {
      expect(service.validateSource('8.8.8.8')).toBe(false);
      expect(service.validateSource('192.168.1.1')).toBe(false);
    });

    it('should reject empty/null IP', () => {
      expect(service.validateSource(null)).toBe(false);
      expect(service.validateSource('')).toBe(false);
    });
  });

  describe('getCheckoutUrl', () => {
    it('should return sandbox URL', () => {
      expect(service.getCheckoutUrl()).toContain('sandbox.payfast.co.za');
    });
  });

  describe('getValidateUrl', () => {
    it('should return sandbox validate URL', () => {
      expect(service.getValidateUrl()).toContain('sandbox.payfast.co.za');
      expect(service.getValidateUrl()).toContain('/query/validate');
    });
  });
});
