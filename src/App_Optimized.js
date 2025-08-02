import React, { useEffect, Suspense, lazy } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { OfflineProvider, useOffline } from './contexts/OfflineContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './components/ui/Notification';
import ErrorBoundary from './components/ui/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load screen components for code splitting
const WelcomeScreen = lazy(() => import('./components/screens/WelcomeScreen'));
const PaymentScreen = lazy(() => import('./components/screens/PaymentScreen'));
const SuccessScreen = lazy(() => import('./components/screens/SuccessScreen'));
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen'));
const QRScannerScreen = lazy(() => import('./components/screens/QRScannerScreen'));
const AuthenticationFlow = lazy(() => import('./components/auth/AuthenticationFlow'));

// Custom Hooks
import { usePaymentFlow } from './hooks/usePaymentFlow';
import { useAuthFlow } from './hooks/useAuthFlow';
import useBehavioralData from './hooks/useBehavioralData';

// Services
import NetworkService from './services/networkService';

// Loading component for Suspense fallback
const ScreenLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 flex items-center justify-center">
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
      <LoadingSpinner size="lg" color="white" />
      <p className="text-white text-center mt-4">Loading...</p>
    </div>
  </div>
);

// Memoized navigation handlers to prevent unnecessary re-renders
const useNavigationHandlers = () => {
  const { setCurrentStep } = useUser();
  const { resetPaymentFlow } = usePaymentFlow();
  const { resetAuthentication, clearSignature } = useAuthFlow();

  return React.useMemo(() => ({
    handleStartPayment: () => {
      resetPaymentFlow();
      clearSignature();
      setCurrentStep('payment');
    },
    handleShowSettings: () => setCurrentStep('settings'),
    handleShowQRScanner: () => setCurrentStep('qr-scanner'),
    handleProceedToAuth: () => setCurrentStep('authentication'),
    handleAuthSuccess: () => setCurrentStep('success'),
    handleBackToWelcome: () => {
      resetPaymentFlow();
      resetAuthentication();
      setCurrentStep('welcome');
    },
    handleMakeAnotherTransfer: () => {
      resetPaymentFlow();
      clearSignature();
      setCurrentStep('payment');
    },
    handleQRScanned: () => setCurrentStep('payment'),
    handleBackToPayment: () => setCurrentStep('payment')
  }), [setCurrentStep, resetPaymentFlow, resetAuthentication, clearSignature]);
};

// Main App Component with performance optimizations
const TapiPayApp = React.memo(() => {
  const { currentStep } = useUser();
  const { offlineMode, initializeDepositSystem, clearDepositSystem } = useOffline();
  const { recordKeystroke, recordTouch } = useBehavioralData();
  
  const navigationHandlers = useNavigationHandlers();

  // Initialize network service
  useEffect(() => {
    NetworkService.initialize();
    return () => NetworkService.cleanup();
  }, []);

  // Initialize offline system when going offline
  useEffect(() => {
    if (offlineMode) {
      initializeDepositSystem(2500.75);
    } else {
      clearDepositSystem();
    }
  }, [offlineMode, initializeDepositSystem, clearDepositSystem]);

  // Add global event listeners for behavioral data (memoized)
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

  // Memoized screen renderer to prevent unnecessary re-renders
  const renderCurrentScreen = React.useMemo(() => {
    const screenProps = {
      welcome: {
        onStartPayment: navigationHandlers.handleStartPayment,
        onShowSettings: navigationHandlers.handleShowSettings
      },
      payment: {
        onBack: navigationHandlers.handleBackToWelcome,
        onProceedToAuth: navigationHandlers.handleProceedToAuth,
        onShowQRScanner: navigationHandlers.handleShowQRScanner
      },
      authentication: {
        onSuccess: navigationHandlers.handleAuthSuccess,
        onBack: navigationHandlers.handleBackToPayment,
        isOnline: !offlineMode,
        skipDemo: false
      },
      success: {
        onBack: navigationHandlers.handleBackToWelcome,
        onMakeAnotherTransfer: navigationHandlers.handleMakeAnotherTransfer
      },
      settings: {
        onBack: navigationHandlers.handleBackToWelcome
      },
      'qr-scanner': {
        onBack: navigationHandlers.handleBackToPayment,
        onQRScanned: navigationHandlers.handleQRScanned
      }
    };

    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen {...screenProps.welcome} />;
      case 'payment':
        return <PaymentScreen {...screenProps.payment} />;
      case 'authentication':
        return <AuthenticationFlow {...screenProps.authentication} />;
      case 'success':
        return <SuccessScreen {...screenProps.success} />;
      case 'settings':
        return <SettingsScreen {...screenProps.settings} />;
      case 'qr-scanner':
        return <QRScannerScreen {...screenProps['qr-scanner']} />;
      default:
        return <WelcomeScreen {...screenProps.welcome} />;
    }
  }, [currentStep, navigationHandlers, offlineMode]);

  return (
    <div className="min-h-screen bg-gray-900">
      <ErrorBoundary>
        <Suspense fallback={<ScreenLoader />}>
          {renderCurrentScreen}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

TapiPayApp.displayName = 'TapiPayApp';

// Root App Component with all providers
const App = () => {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <UserProvider>
          <OfflineProvider>
            <PaymentProvider>
              <AuthProvider>
                <TapiPayApp />
              </AuthProvider>
            </PaymentProvider>
          </OfflineProvider>
        </UserProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;
