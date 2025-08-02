import { useCallback } from 'react';
import { usePayment } from '../contexts/PaymentContext';
import { useUser } from '../contexts/UserContext';
import { useOffline } from '../contexts/OfflineContext';
import PaymentService from '../services/paymentService';

// Custom hook for payment flow management
export const usePaymentFlow = () => {
  const payment = usePayment();
  const user = useUser();
  const offline = useOffline();

  // Process payment based on mode (online/offline)
  const processPayment = useCallback(async (paymentData) => {
    try {
      payment.setProcessing(true);
      payment.setError('');

      // Validate payment data
      const validation = PaymentService.validatePaymentData(paymentData);
      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors)[0];
        payment.setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const amount = parseFloat(paymentData.amount);
      let result;

      if (offline.offlineMode) {
        // Process offline payment
        const offlineValidation = offline.validateOfflinePayment(amount);
        if (!offlineValidation.valid) {
          payment.setError(offlineValidation.error);
          return { success: false, error: offlineValidation.error };
        }

        result = PaymentService.processOfflinePayment(amount, offline.depositSystem);
        offline.processOfflinePayment(amount);
      } else {
        // Process online payment
        if (!user.hasBalance(amount)) {
          const error = `Insufficient balance. Available: ${user.getFormattedBalance()}`;
          payment.setError(error);
          return { success: false, error };
        }

        result = await PaymentService.processOnlinePayment(amount, user.profile.balance);
        user.deductBalance(amount);
      }

      // Store successful result
      payment.setResult(result);
      return result;

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      payment.setError(error.message);
      return { success: false, error: error.message };
    } finally {
      payment.setProcessing(false);
    }
  }, [payment, user, offline]);

  // Generate payment summary
  const generateSummary = useCallback((paymentData) => {
    return PaymentService.generatePaymentSummary(paymentData, offline.offlineMode);
  }, [offline.offlineMode]);

  // Validate payment before processing
  const validatePayment = useCallback((paymentData) => {
    const validation = PaymentService.validatePaymentData(paymentData);
    
    if (validation.isValid) {
      const amount = parseFloat(paymentData.amount);
      
      if (offline.offlineMode) {
        const offlineValidation = offline.validateOfflinePayment(amount);
        return offlineValidation;
      } else {
        const hasBalance = user.hasBalance(amount);
        return {
          valid: hasBalance,
          error: hasBalance ? null : `Insufficient balance. Available: ${user.getFormattedBalance()}`
        };
      }
    }

    return {
      valid: false,
      error: Object.values(validation.errors)[0]
    };
  }, [offline, user]);

  // Reset payment flow
  const resetPaymentFlow = useCallback(() => {
    payment.resetPayment();
    payment.resetForm();
  }, [payment]);

  // Handle QR code scanning
  const handleQRScan = useCallback((qrString) => {
    const result = PaymentService.parseQRPaymentData(qrString);
    
    if (result.success) {
      payment.updateFormData({
        recipient: result.data.recipient,
        bank: result.data.bank
      });
      return { success: true, data: result.data };
    }
    
    return { success: false, error: result.error };
  }, [payment]);

  // Generate QR code for user
  const generateUserQR = useCallback(() => {
    return PaymentService.generateQRPaymentData(user.profile);
  }, [user.profile]);

  return {
    // Payment state
    ...payment,
    
    // Payment actions
    processPayment,
    generateSummary,
    validatePayment,
    resetPaymentFlow,
    handleQRScan,
    generateUserQR,
    
    // Utility functions
    formatCurrency: PaymentService.formatCurrency
  };
};

export default usePaymentFlow;
