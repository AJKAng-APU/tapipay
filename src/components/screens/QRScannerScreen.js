import React, { useState } from "react";
import { ArrowLeft, Camera, Scan } from "lucide-react";
import { usePaymentFlow } from "../../hooks/usePaymentFlow";

const QRScannerScreen = ({ onBack, onQRScanned }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { handleQRScan, generateUserQR } = usePaymentFlow();

  // Start camera simulation
  const startCamera = () => {
    setCameraActive(true);
    setIsScanning(true);
  };

  // Stop camera simulation
  const stopCamera = () => {
    setCameraActive(false);
    setIsScanning(false);
  };

  // Demo QR scan with user's own QR
  const handleDemoScan = () => {
    const userQR = generateUserQR();
    const result = handleQRScan(userQR);

    if (result.success) {
      onQRScanned(result.data);
    } else {
      console.error("QR scan failed:", result.error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {/* Fixed gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600"></div>

      {/* Scrollable content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-indigo-200 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Scan QR Code</h1>
            <p className="text-indigo-100">
              Scan a TapiPay QR code to auto-fill payment details
            </p>
          </div>

          {/* Camera Viewfinder */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
            <div className="relative">
              {/* Camera Preview Area */}
              <div className="aspect-square bg-black/50 rounded-xl overflow-hidden relative">
                {cameraActive ? (
                  // Active camera simulation
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                    <div className="text-white/60 text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Camera Active</p>
                      <p className="text-sm">Point at a QR code to scan</p>
                    </div>

                    {/* Scanning overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-blue-400 rounded-lg relative">
                          {/* Corner markers */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400"></div>

                          {/* Scanning line animation */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Inactive camera
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white/40 text-center">
                      <Scan className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Camera Inactive</p>
                      <p className="text-sm">Tap start to begin scanning</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">Camera Controls</h3>

            <div className="flex space-x-4">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Demo Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4">Demo QR Scan</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Test the QR scanning functionality with your own QR code
            </p>

            <button
              onClick={handleDemoScan}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Scan className="w-5 h-5" />
              <span>Demo: Scan QR</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/20">
            <h4 className="text-blue-300 font-medium mb-3">📱 How to Scan</h4>
            <ul className="text-blue-100 text-sm space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">1.</span>
                <span>Tap "Start Camera" to activate the scanner</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">2.</span>
                <span>Point your camera at a TapiPay QR code</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">3.</span>
                <span>Wait for the code to be automatically detected</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400 mt-0.5">4.</span>
                <span>Payment details will auto-fill in the form</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerScreen;
