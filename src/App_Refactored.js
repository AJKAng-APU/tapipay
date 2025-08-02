import React, { useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { PaymentProvider, usePayment } from './contexts/PaymentContext';
import { OfflineProvider, useOffline } from './contexts/OfflineContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Screen Components
import WelcomeScreen from './components/screens/WelcomeScreen';
import PaymentScreen from './components/screens/PaymentScreen';
import SuccessScreen from './components/screens/SuccessScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import QRScannerScreen from './components/screens/QRScannerScreen';

// Authentication Components
import AuthenticationFlow from './components/auth/AuthenticationFlow';

// Custom Hooks
import { usePaymentFlow } from './hooks/usePaymentFlow';
import { useAuthFlow } from './hooks/useAuthFlow';
import useBehavioralData from './hooks/useBehavioralData';

// Services
import NetworkService from './services/networkService';

// Main App Component (using contexts)
const TapiPayApp = () => {
  const { currentStep, setCurrentStep } = useUser();
  const { resetPaymentFlow } = usePaymentFlow();
  const { resetAuthentication, clearSignature } = useAuthFlow();
  const { offlineMode, initializeDepositSystem, clearDepositSystem } = useOffline();
  const { recordKeystroke, recordTouch } = useBehavioralData();

  // Initialize network service
  useEffect(() => {
    NetworkService.initialize();
    
    return () => {
      NetworkService.cleanup();
    };
  }, []);

  // Initialize offline system when going offline
  useEffect(() => {
    if (offlineMode) {
      // Initialize offline system with user balance
      // This would normally get the balance from user context
      initializeDepositSystem(2500.75);
    } else {
      // Clear offline system when going online
      clearDepositSystem();
    }
  }, [offlineMode, initializeDepositSystem, clearDepositSystem]);

  // Add global event listeners for behavioral data
  useEffect(() => {
    const handleKeyDown = (e) => recordKeystroke(e.key, e.code);
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      recordTouch(touch.clientX, touch.clientY, 'start');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [recordKeystroke, recordTouch]);

  // Navigation handlers
  const handleStartPayment = () => {
    resetPaymentFlow();
    clearSignature();
    setCurrentStep('payment');
  };

  const handleShowSettings = () => {
    setCurrentStep('settings');
  };

  const handleShowQRScanner = () => {
    setCurrentStep('qr-scanner');
  };

  const handleProceedToAuth = () => {
    setCurrentStep('authentication');
  };

  const handleAuthSuccess = () => {
    setCurrentStep('success');
  };

  const handleBackToWelcome = () => {
    resetPaymentFlow();
    resetAuthentication();
    setCurrentStep('welcome');
  };

  const handleMakeAnotherTransfer = () => {
    resetPaymentFlow();
    clearSignature();
    setCurrentStep('payment');
  };

  const handleQRScanned = (qrData) => {
    // QR data is already handled by the payment flow hook
    setCurrentStep('payment');
  };

  // Render current screen based on step
  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            onStartPayment={handleStartPayment}
            onShowSettings={handleShowSettings}
          />
        );

      case 'payment':
        return (
          <PaymentScreen
            onBack={handleBackToWelcome}
            onProceedToAuth={handleProceedToAuth}
            onShowQRScanner={handleShowQRScanner}
          />
        );

      case 'authentication':
        return (
          <AuthenticationFlow
            onSuccess={handleAuthSuccess}
            onBack={() => setCurrentStep('payment')}
            isOnline={!offlineMode}
            skipDemo={false}
          />
        );

      case 'success':
        return (
          <SuccessScreen
            onBack={handleBackToWelcome}
            onMakeAnotherTransfer={handleMakeAnotherTransfer}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            onBack={handleBackToWelcome}
          />
        );

      case 'qr-scanner':
        return (
          <QRScannerScreen
            onBack={() => setCurrentStep('payment')}
            onQRScanned={handleQRScanned}
          />
        );

      default:
        return (
          <WelcomeScreen
            onStartPayment={handleStartPayment}
            onShowSettings={handleShowSettings}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {renderCurrentScreen()}
    </div>
  );
};

// Root App Component with Providers
const App = () => {
  return (
    <UserProvider>
      <OfflineProvider>
        <PaymentProvider>
          <AuthProvider>
            <TapiPayApp />
          </AuthProvider>
        </PaymentProvider>
      </OfflineProvider>
    </UserProvider>
  );
};

export default App;
