import React, { useState, useEffect } from 'react';
import { ArrowLeft, QrCode, Wifi, WifiOff } from 'lucide-react';
import { usePayment } from '../../contexts/PaymentContext';
import { useOffline } from '../../contexts/OfflineContext';
import { usePaymentFlow } from '../../hooks/usePaymentFlow';

const PaymentScreen = ({ onBack, onProceedToAuth, onShowQRScanner }) => {
  const { formData, updateFormData, error } = usePayment();
  const { isOnline, offlineMode, calculateOfflineBalance } = useOffline();
  const { validatePayment, generateSummary, formatCurrency } = usePaymentFlow();
  
  const [validationError, setValidationError] = useState('');
  const [summary, setSummary] = useState(null);

  // Available banks
  const banks = [
    { id: 'maybank', name: 'Maybank', color: 'bg-yellow-500' },
    { id: 'cimb', name: 'CIMB Bank', color: 'bg-red-500' },
    { id: 'publicbank', name: 'Public Bank', color: 'bg-blue-500' },
    { id: 'rhb', name: 'RHB Bank', color: 'bg-blue-600' },
    { id: 'hongleong', name: 'Hong Leong Bank', color: 'bg-green-500' },
    { id: 'ambank', name: 'AmBank', color: 'bg-orange-500' },
    { id: 'uob', name: 'UOB Bank', color: 'bg-blue-700' },
    { id: 'ocbc', name: 'OCBC Bank', color: 'bg-red-600' },
    { id: 'grabpay', name: 'GrabPay', color: 'bg-green-600' },
    { id: 'boost', name: 'Boost', color: 'bg-purple-500' },
    { id: 'tng', name: 'Touch \'n Go eWallet', color: 'bg-blue-500' }
  ];

  // Quick amount buttons
  const quickAmounts = [10, 25, 50, 100, 200, 500];

  // Update summary when form data changes
  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      const paymentSummary = generateSummary(formData);
      setSummary(paymentSummary);
    } else {
      setSummary(null);
    }
  }, [formData, generateSummary]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
    setValidationError('');
  };

  // Handle quick amount selection
  const handleQuickAmount = (amount) => {
    handleInputChange('amount', amount.toString());
  };

  // Handle form submission
  const handleSubmit = () => {
    const validation = validatePayment(formData);
    
    if (validation.valid) {
      onProceedToAuth();
    } else {
      setValidationError(validation.error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {/* Fixed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600"></div>
      
      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Back</span>
          </button>
          
          {/* Network Status */}
          <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/30">
            {isOnline && !offlineMode ? (
              <>
                <Wifi className="w-4 h-4 text-green-300" />
                <span className="text-green-300 text-xs font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-300" />
                <span className="text-orange-300 text-xs font-medium">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Bank Transfer</h1>
            <p className="text-blue-100">Enter payment details</p>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            {/* Amount Input */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <label className="block text-white font-medium mb-3">Amount (RM)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg py-2 px-3 text-white text-sm transition-all duration-200"
                  >
                    RM{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-white font-medium">Recipient Details</label>
                <button
                  onClick={onShowQRScanner}
                  className="flex items-center space-x-1 text-blue-300 hover:text-blue-200 text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange('recipient', e.target.value)}
                  placeholder="Recipient Name"
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Account Number"
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bank Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <label className="block text-white font-medium mb-4">Select Bank</label>
              <div className="grid grid-cols-2 gap-3">
                {banks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => handleInputChange('bank', bank.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      formData.bank === bank.id
                        ? 'border-blue-400 bg-blue-400/20'
                        : 'border-white/30 bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${bank.color}`}></div>
                      <span className="text-white text-sm font-medium">{bank.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference (Optional) */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <label className="block text-white font-medium mb-3">Reference (Optional)</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Payment reference"
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Payment Summary */}
            {summary && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-medium mb-4">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-blue-100">
                    <span>Payment Amount:</span>
                    <span>{formatCurrency(summary.amount)}</span>
                  </div>
                  {summary.securityDeposit > 0 && (
                    <div className="flex justify-between text-blue-100">
                      <span>Security Deposit:</span>
                      <span>{formatCurrency(summary.securityDeposit)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <div className="flex justify-between text-white font-medium">
                      <span>Total Required:</span>
                      <span>{formatCurrency(summary.totalCost)}</span>
                    </div>
                  </div>
                </div>
                
                {offlineMode && (
                  <div className="mt-4 p-3 bg-orange-500/20 rounded-lg border border-orange-400/30">
                    <p className="text-orange-200 text-sm">
                      Available offline balance: {formatCurrency(calculateOfflineBalance())}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {(error || validationError) && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                <p className="text-red-200 text-sm">{error || validationError}</p>
              </div>
            )}

            {/* Proceed Button */}
            <button
              onClick={handleSubmit}
              disabled={!formData.amount || !formData.recipient || !formData.accountNumber || !formData.bank}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200"
            >
              Proceed to Authentication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
