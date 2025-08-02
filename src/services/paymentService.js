// Payment Service - Handles all payment-related business logic

export class PaymentService {
  // Calculate security deposit based on payment amount
  static calculateSecurityDeposit(paymentAmount) {
    // No deposits required - simplified system
    return 0;
  }

  // Calculate total cost for payment
  static calculateTotalCost(paymentAmount) {
    const securityDeposit = this.calculateSecurityDeposit(paymentAmount);
    return parseFloat(paymentAmount) + securityDeposit;
  }

  // Process online payment
  static async processOnlinePayment(paymentAmount, userBalance) {
    try {
      const amount = parseFloat(paymentAmount);
      
      // Validate sufficient balance
      if (amount > userBalance) {
        throw new Error(`Insufficient balance. Available: RM${userBalance.toFixed(2)}`);
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = {
        success: true,
        transactionId: `PAY_${Date.now()}`,
        amount: amount,
        method: 'online',
        timestamp: new Date().toISOString(),
        remainingBalance: userBalance - amount
      };

      console.log('💳 Online payment processed:', result);
      return result;
    } catch (error) {
      console.error('❌ Online payment failed:', error);
      throw error;
    }
  }

  // Process offline payment
  static processOfflinePayment(paymentAmount, offlineSystem) {
    try {
      const amount = parseFloat(paymentAmount);
      
      // Validate offline balance
      if (amount > offlineSystem.availableBalance) {
        throw new Error(`Insufficient offline balance. Available: RM${offlineSystem.availableBalance.toFixed(2)}`);
      }

      const result = {
        success: true,
        transactionId: `PAY_${Date.now()}`,
        amount: amount,
        method: 'offline',
        timestamp: new Date().toISOString(),
        remainingBalance: offlineSystem.availableBalance - amount
      };

      console.log('💳 Offline payment processed:', result);
      return result;
    } catch (error) {
      console.error('❌ Offline payment failed:', error);
      throw error;
    }
  }

  // Validate payment data
  static validatePaymentData(paymentData) {
    const errors = {};

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    if (!paymentData.recipient || paymentData.recipient.trim().length < 2) {
      errors.recipient = 'Please enter recipient name';
    }

    if (!paymentData.accountNumber || paymentData.accountNumber.trim().length < 4) {
      errors.accountNumber = 'Please enter a valid account number';
    }

    if (!paymentData.bank) {
      errors.bank = 'Please select a bank';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Generate payment summary
  static generatePaymentSummary(paymentData, isOffline = false) {
    const amount = parseFloat(paymentData.amount);
    const securityDeposit = this.calculateSecurityDeposit(amount);
    const totalCost = this.calculateTotalCost(amount);

    return {
      amount,
      securityDeposit,
      totalCost,
      recipient: paymentData.recipient,
      accountNumber: paymentData.accountNumber,
      bank: paymentData.bank,
      reference: paymentData.reference || '',
      isOffline,
      breakdown: {
        paymentAmount: amount,
        securityDeposit: securityDeposit,
        total: totalCost
      }
    };
  }

  // Format currency
  static formatCurrency(amount) {
    return `RM${parseFloat(amount).toFixed(2)}`;
  }

  // Parse QR payment data
  static parseQRPaymentData(qrString) {
    try {
      const data = JSON.parse(qrString);
      
      if (data.type !== 'TapiPay_Transfer') {
        throw new Error('Invalid QR code format');
      }

      return {
        success: true,
        data: {
          recipient: data.name,
          bank: data.bank,
          securityKey: data.securityKey
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid QR code format'
      };
    }
  }

  // Generate QR payment data
  static generateQRPaymentData(userProfile) {
    return JSON.stringify({
      type: 'TapiPay_Transfer',
      name: userProfile.name,
      securityKey: userProfile.securityKey,
      bank: userProfile.bank,
      version: '1.0'
    });
  }
}

export default PaymentService;
