import React from 'react';
import { CreditCard, Settings, Wifi, WifiOff } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useOffline } from '../../contexts/OfflineContext';

const WelcomeScreen = ({ onStartPayment, onShowSettings }) => {
  const { profile, getFormattedBalance } = useUser();
  const { isOnline, offlineMode, setOfflineMode } = useOffline();

  const handleOfflineToggle = () => {
    setOfflineMode(!offlineMode);
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {/* Fixed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600"></div>
      
      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">TapiPay</h1>
            <p className="text-blue-100 text-sm">Secure Mobile Banking</p>
          </div>
          
          {/* Network Status Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleOfflineToggle}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
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
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-6">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {profile.name.split(' ')[0]}!
            </h2>
            <p className="text-blue-100">
              Ready to make secure payments with biometric authentication
            </p>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-white">{getFormattedBalance()}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm mb-1">Account</p>
                <p className="text-white font-medium">{profile.accountNumber}</p>
                <p className="text-blue-200 text-xs capitalize">{profile.bank}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Main Transfer Button */}
            <button
              onClick={onStartPayment}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-lg">Make Bank Transfer</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onShowSettings}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <Settings className="w-6 h-6" />
              <span className="text-lg">My QR & Settings</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-green-400 text-2xl mb-2">🔒</div>
              <h3 className="text-white font-semibold text-sm mb-1">Secure</h3>
              <p className="text-blue-100 text-xs">Multi-factor biometric authentication</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-blue-400 text-2xl mb-2">⚡</div>
              <h3 className="text-white font-semibold text-sm mb-1">Fast</h3>
              <p className="text-blue-100 text-xs">Instant transfers and payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
