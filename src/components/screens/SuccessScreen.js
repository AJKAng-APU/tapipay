import React from 'react';
import { CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { usePayment } from '../../contexts/PaymentContext';
import { useUser } from '../../contexts/UserContext';
import { useOffline } from '../../contexts/OfflineContext';

const SuccessScreen = ({ onBack, onMakeAnotherTransfer }) => {
  const { result, formData } = usePayment();
  const { profile, getFormattedBalance } = useUser();
  const { offlineMode, calculateOfflineBalance } = useOffline();

  // Get payment details from result or fallback to form data
  const paymentAmount = result?.amount || parseFloat(formData.amount) || 0;
  const transactionId = result?.transactionId || `PAY_${Date.now()}`;
  const timestamp = result?.timestamp || new Date().toISOString();
  const remainingBalance = result?.remainingBalance || profile.balance;

  const formatCurrency = (amount) => `RM${parseFloat(amount).toFixed(2)}`;
  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {/* Fixed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-500 via-blue-600 to-purple-600"></div>
      
      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-green-200 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          {/* Success Icon and Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-green-100">Your transfer has been processed successfully</p>
          </div>

          {/* Payment Details Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-white font-semibold text-lg mb-4">Payment Details</h2>
            
            <div className="space-y-4">
              {/* Amount */}
              <div className="flex justify-between items-center">
                <span className="text-green-100">Amount Transferred:</span>
                <span className="text-white font-semibold text-lg">{formatCurrency(paymentAmount)}</span>
              </div>

              {/* Recipient */}
              <div className="flex justify-between items-center">
                <span className="text-green-100">To:</span>
                <span className="text-white font-medium">{formData.recipient}</span>
              </div>

              {/* Account Number */}
              <div className="flex justify-between items-center">
                <span className="text-green-100">Account:</span>
                <span className="text-white font-medium">{formData.accountNumber}</span>
              </div>

              {/* Bank */}
              <div className="flex justify-between items-center">
                <span className="text-green-100">Bank:</span>
                <span className="text-white font-medium capitalize">{formData.bank}</span>
              </div>

              {/* Reference (if provided) */}
              {formData.reference && (
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Reference:</span>
                  <span className="text-white font-medium">{formData.reference}</span>
                </div>
              )}

              {/* Transaction ID */}
              <div className="border-t border-white/20 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Transaction ID:</span>
                  <span className="text-white font-mono text-sm">{transactionId}</span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex justify-between items-center">
                <span className="text-green-100">Date & Time:</span>
                <span className="text-white font-medium">{formatDateTime(timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Balance Information */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">Account Balance</h3>
            
            {offlineMode ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-100">Available Offline Balance:</span>
                  <span className="text-white font-semibold">{formatCurrency(calculateOfflineBalance())}</span>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg border border-orange-400/30">
                  <p className="text-orange-200 text-sm">
                    💡 Your main account balance will be updated when you go back online
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-green-100">Remaining Balance:</span>
                <span className="text-white font-semibold text-lg">{getFormattedBalance()}</span>
              </div>
            )}
          </div>

          {/* Payment Method Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {offlineMode ? 'Offline Payment' : 'Online Payment'}
                </p>
                <p className="text-green-100 text-sm">
                  Secured with biometric authentication
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Make Another Transfer */}
            <button
              onClick={onMakeAnotherTransfer}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <CreditCard className="w-6 h-6" />
              <span>Make Another Transfer</span>
            </button>

            {/* Back to Home */}
            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200"
            >
              Back to Home
            </button>
          </div>

          {/* Success Tips */}
          <div className="mt-8 p-4 bg-green-500/10 rounded-xl border border-green-400/20">
            <h4 className="text-green-300 font-medium mb-2">💡 What's Next?</h4>
            <ul className="text-green-100 text-sm space-y-1">
              <li>• Your recipient will receive the funds shortly</li>
              <li>• Keep this transaction ID for your records</li>
              <li>• Check your account statement for confirmation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessScreen;
