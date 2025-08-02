import PaymentService from '../../services/paymentService';

describe('PaymentService', () => {
  describe('calculateSecurityDeposit', () => {
    test('returns 0 for all amounts (no deposits required)', () => {
      expect(PaymentService.calculateSecurityDeposit(50)).toBe(0);
      expect(PaymentService.calculateSecurityDeposit(100)).toBe(0);
      expect(PaymentService.calculateSecurityDeposit(500)).toBe(0);
    });
  });

  describe('calculateTotalCost', () => {
    test('returns payment amount only (no deposits)', () => {
      expect(PaymentService.calculateTotalCost(100)).toBe(100);
      expect(PaymentService.calculateTotalCost(250.50)).toBe(250.50);
    });
  });

  describe('validatePaymentData', () => {
    test('validates complete payment data', () => {
      const validData = {
        amount: '100',
        recipient: 'John Doe',
        accountNumber: '1234567890',
        bank: 'maybank'
      };

      const result = PaymentService.validatePaymentData(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    test('returns errors for invalid data', () => {
      const invalidData = {
        amount: '',
        recipient: '',
        accountNumber: '123',
        bank: ''
      };

      const result = PaymentService.validatePaymentData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBeDefined();
      expect(result.errors.recipient).toBeDefined();
      expect(result.errors.accountNumber).toBeDefined();
      expect(result.errors.bank).toBeDefined();
    });

    test('validates minimum recipient name length', () => {
      const data = {
        amount: '100',
        recipient: 'A',
        accountNumber: '1234567890',
        bank: 'maybank'
      };

      const result = PaymentService.validatePaymentData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.recipient).toBe('Please enter recipient name');
    });
  });

  describe('processOnlinePayment', () => {
    test('processes valid online payment', async () => {
      const result = await PaymentService.processOnlinePayment(100, 500);
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(100);
      expect(result.method).toBe('online');
      expect(result.remainingBalance).toBe(400);
      expect(result.transactionId).toMatch(/^PAY_\d+$/);
    });

    test('throws error for insufficient balance', async () => {
      await expect(
        PaymentService.processOnlinePayment(600, 500)
      ).rejects.toThrow('Insufficient balance. Available: RM500.00');
    });
  });

  describe('processOfflinePayment', () => {
    test('processes valid offline payment', () => {
      const offlineSystem = { availableBalance: 200 };
      const result = PaymentService.processOfflinePayment(100, offlineSystem);
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(100);
      expect(result.method).toBe('offline');
      expect(result.remainingBalance).toBe(100);
    });

    test('throws error for insufficient offline balance', () => {
      const offlineSystem = { availableBalance: 50 };
      
      expect(() => {
        PaymentService.processOfflinePayment(100, offlineSystem);
      }).toThrow('Insufficient offline balance. Available: RM50.00');
    });
  });

  describe('generatePaymentSummary', () => {
    test('generates payment summary', () => {
      const paymentData = {
        amount: '150',
        recipient: 'John Doe',
        accountNumber: '1234567890',
        bank: 'maybank',
        reference: 'Test payment'
      };

      const summary = PaymentService.generatePaymentSummary(paymentData, false);
      
      expect(summary.amount).toBe(150);
      expect(summary.securityDeposit).toBe(0);
      expect(summary.totalCost).toBe(150);
      expect(summary.recipient).toBe('John Doe');
      expect(summary.isOffline).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      expect(PaymentService.formatCurrency(100)).toBe('RM100.00');
      expect(PaymentService.formatCurrency(25.5)).toBe('RM25.50');
      expect(PaymentService.formatCurrency('150.75')).toBe('RM150.75');
    });
  });

  describe('parseQRPaymentData', () => {
    test('parses valid QR data', () => {
      const validQR = JSON.stringify({
        type: 'TapiPay_Transfer',
        name: 'John Doe',
        bank: 'maybank',
        securityKey: 'ABC123'
      });

      const result = PaymentService.parseQRPaymentData(validQR);
      
      expect(result.success).toBe(true);
      expect(result.data.recipient).toBe('John Doe');
      expect(result.data.bank).toBe('maybank');
      expect(result.data.securityKey).toBe('ABC123');
    });

    test('handles invalid QR data', () => {
      const invalidQR = 'invalid json';
      const result = PaymentService.parseQRPaymentData(invalidQR);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid QR code format');
    });

    test('rejects wrong QR type', () => {
      const wrongTypeQR = JSON.stringify({
        type: 'Other_Transfer',
        name: 'John Doe'
      });

      const result = PaymentService.parseQRPaymentData(wrongTypeQR);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid QR code format');
    });
  });

  describe('generateQRPaymentData', () => {
    test('generates QR data for user profile', () => {
      const userProfile = {
        name: 'Jane Doe',
        bank: 'cimb',
        securityKey: 'XYZ789'
      };

      const qrData = PaymentService.generateQRPaymentData(userProfile);
      const parsed = JSON.parse(qrData);
      
      expect(parsed.type).toBe('TapiPay_Transfer');
      expect(parsed.name).toBe('Jane Doe');
      expect(parsed.bank).toBe('cimb');
      expect(parsed.securityKey).toBe('XYZ789');
      expect(parsed.version).toBe('1.0');
    });
  });
});
