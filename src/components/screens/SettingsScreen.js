import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUser } from '../../contexts/UserContext';
import { usePaymentFlow } from '../../hooks/usePaymentFlow';

const SettingsScreen = ({ onBack }) => {
  const { profile } = useUser();
  const { generateUserQR } = usePaymentFlow();
  const [qrData, setQrData] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate QR data on component mount
  useEffect(() => {
    const qrString = generateUserQR();
    setQrData(qrString);
  }, [generateUserQR]);

  // Copy QR data to clipboard
  const copyQRToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR data:', error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {/* Fixed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600"></div>
      
      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">My QR & Settings</h1>
            <p className="text-purple-100">Share your QR code for easy payments</p>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <p className="text-purple-100">{profile.accountNumber}</p>
                <p className="text-purple-200 text-sm capitalize">{profile.bank}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-purple-200 text-xs mb-1">Security Key</p>
                <p className="text-white font-mono">{profile.securityKey}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-purple-200 text-xs mb-1">Bank</p>
                <p className="text-white capitalize">{profile.bank}</p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
            <h3 className="text-white font-semibold text-lg mb-4">Your Payment QR Code</h3>
            
            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-xl">
                {qrData && (
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                )}
              </div>
            </div>

            {/* QR Data Display */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-medium">QR Data</h4>
                <button
                  onClick={copyQRToClipboard}
                  className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded-lg transition-colors"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-purple-100 text-xs whitespace-pre-wrap break-all">
                {qrData}
              </pre>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-400/20">
              <h4 className="text-blue-300 font-medium mb-2">📱 How to Share</h4>
              <ul className="text-blue-100 text-sm space-y-1">
                <li>• Show this QR code to someone who wants to pay you</li>
                <li>• They can scan it with their TapiPay app</li>
                <li>• Your details will auto-fill in their payment form</li>
                <li>• Or copy the QR data and share it digitally</li>
              </ul>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-white font-semibold text-lg mb-4">Account Settings</h3>
            
            <div className="space-y-4">
              {/* Balance Display */}
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-purple-100">Current Balance</span>
                <span className="text-white font-semibold">RM{profile.balance.toFixed(2)}</span>
              </div>

              {/* Account Info */}
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-purple-100">Account Number</span>
                <span className="text-white font-mono">{profile.accountNumber}</span>
              </div>

              {/* Security Key */}
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-purple-100">Security Key</span>
                <span className="text-white font-mono">{profile.securityKey}</span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h4 className="text-white font-medium mb-3">🔒 Security Features</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-green-400 text-2xl mb-1">👤</div>
                <p className="text-white text-sm font-medium">Face Recognition</p>
                <p className="text-purple-200 text-xs">Biometric Security</p>
              </div>
              <div className="text-center">
                <div className="text-blue-400 text-2xl mb-1">✍️</div>
                <p className="text-white text-sm font-medium">Digital Signature</p>
                <p className="text-purple-200 text-xs">Offline Verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
