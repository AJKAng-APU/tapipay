import React, { useState, useEffect } from "react";
import {
  Shield,
  CreditCard,
  Fingerprint,
  ArrowLeft,
  Camera,
  Scan,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Smartphone,
} from "lucide-react";
import FaceRecognition from "./FaceRecognition";

const AuthenticationFlow = ({
  onSuccess,
  onBack,
  isOnline = true,
  skipDemo = false,
}) => {
  const [currentStep, setCurrentStep] = useState(
    skipDemo ? "face-auth" : "demo"
  );
  const [authProgress, setAuthProgress] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResult, setAuthResult] = useState(null);
  const [faceResult, setFaceResult] = useState(null);
  const [userPin, setUserPin] = useState("");
  const offlineMode = !isOnline;

  // Offline Status Indicator Component
  const OfflineIndicator = () => {
    if (isOnline && !offlineMode) return null;

    return (
      <div className="absolute top-2 right-2 z-50">
        <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg px-3 py-1 border border-orange-400/30">
          <div className="flex items-center text-orange-300 text-xs font-medium">
            <WifiOff className="w-3 h-3 mr-1" />
            <span>Offline Mode</span>
          </div>
        </div>
      </div>
    );
  };

  // Start authentication process
  const startAuth = () => {
    console.log("🔄 Authentication started");
    setCurrentStep("face-auth");
  };

  // Handle PIN entry
  const handlePinEntry = (digit) => {
    if (userPin.length < 6) {
      const newPin = userPin + digit;
      setUserPin(newPin);

      if (newPin.length === 6) {
        // Simulate PIN verification
        setTimeout(() => {
          setAuthResult({ method: "PIN", timestamp: new Date().toISOString() });
          onSuccess({ method: "PIN", timestamp: new Date().toISOString() });
        }, 1000);
      }
    }
  };

  // Clear PIN
  const clearPin = () => {
    setUserPin("");
  };

  // Handle touch events for behavioral data
  const handleTouchStart = (e) => {
    // Touch tracking would be handled by parent component
  };

  const handleTouchEnd = (e) => {
    // Touch tracking would be handled by parent component
  };

  // Simulate authentication progress
  useEffect(() => {
    if (isAuthenticating) {
      const interval = setInterval(() => {
        setAuthProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsAuthenticating(false);
            setAuthResult({
              method: faceResult ? "Face Recognition" : "PIN",
              timestamp: new Date().toISOString(),
            });
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isAuthenticating, faceResult]);

  // Handle authentication success callback
  useEffect(() => {
    if (authResult && onSuccess) {
      // Use setTimeout to ensure the callback runs after the current render cycle
      const timeoutId = setTimeout(() => {
        onSuccess(authResult);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [authResult, onSuccess]);

  // Demo Screen - Original Design
  const DemoScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-green-900">
      <OfflineIndicator />

      <div className="p-6 h-full flex flex-col">
        <div className="h-6"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-white mr-2" />
            <h2 className="text-lg font-bold text-white">
              TapiPay Authentication
            </h2>
          </div>
          <button
            onClick={() => {
              console.log("🔙 User clicked 'Back' from demo");
              onBack();
            }}
            className="flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6 transform transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Kedai Makan Siti
            </h3>
            <p className="text-gray-500 text-sm mb-4">Nasi Lemak + Teh Tarik</p>

            <div className="text-3xl font-bold text-gray-800 mb-6">
              RM 25.50
            </div>

            <button
              onClick={() => {
                console.log("💳 User initiated payment");
                startAuth();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 rounded-2xl text-base font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Fingerprint className="w-5 h-5 mr-3 group-hover:animate-pulse" />
              Pay with TapiPay
              <div className="ml-3 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Shield className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-white text-xs font-medium">Secure</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Camera className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-white text-xs font-medium">Face ID</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Fingerprint className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-white text-xs font-medium">Touch</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <CheckCircle className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <div className="text-white text-xs font-medium">Instant</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
          <div className="flex items-center justify-center text-white text-xs">
            <Shield className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="font-medium">
              {offlineMode
                ? "Offline Mode: Cryptographic Authentication"
                : "Multi-Modal Biometric Security"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Face Authentication Screen - Original Design
  const FaceAuthScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-green-900">
      <OfflineIndicator />

      <div className="p-6 h-full flex flex-col">
        <div className="h-6"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Camera className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-lg font-bold text-white">
              Face Authentication
            </h2>
          </div>
          <button
            onClick={() => {
              console.log("🔙 User clicked 'Back' from face auth");
              if (skipDemo) {
                onBack(); // Go back to transfer screen if we skipped demo
              } else {
                setCurrentStep("demo");
              }
            }}
            className="flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <FaceRecognition
            onSuccess={(result) => {
              setFaceResult(result);
              setIsAuthenticating(true);
            }}
            onError={(error) => {
              console.error("Face recognition error:", error);
              setCurrentStep("step-up");
            }}
            onSkip={() => setCurrentStep("step-up")}
            isOnline={isOnline}
          />
        </div>
      </div>
    </div>
  );

  // Authenticating Screen - Original Design
  const AuthenticatingScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex flex-col">
      <OfflineIndicator />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center w-full">
          <div className="relative mb-8">
            <div className="w-36 h-36 mx-auto relative">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${authProgress * 2.83} 283`}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {Math.round(authProgress)}%
                  </div>
                  <div className="text-blue-200 text-xs">Verifying</div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Authenticating...
          </h2>
          <p className="text-blue-200 text-sm mb-8 px-4">
            {offlineMode
              ? "Processing biometric data locally with cryptographic validation"
              : "Analyzing biometric patterns with quantum-resistant encryption"}
          </p>

          <div className="space-y-3 text-left max-w-xs mx-auto">
            <div className="flex items-center text-white/80 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
              <span>Face pattern verified</span>
            </div>
            <div className="flex items-center text-white/80 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
              <span>Behavioral analysis complete</span>
            </div>
            <div className="flex items-center text-white/80 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
              <span>Security validation passed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step-up Authentication Screen - Original Design
  const StepUpScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-red-900 via-purple-900 to-blue-900">
      <OfflineIndicator />

      <div className="p-6 h-full flex flex-col">
        <div className="h-6"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-red-400 mr-2" />
            <h2 className="text-lg font-bold text-white">
              Step-up Authentication
            </h2>
          </div>
          <button
            onClick={() => {
              console.log("🔙 User clicked 'Back' from step-up");
              setCurrentStep("face-auth");
            }}
            className="flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Additional Verification Required
            </h3>
            <p className="text-red-200 text-sm mb-6 px-4">
              Face recognition was not successful. Please enter your 6-digit PIN
              to complete the payment.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
            <div className="text-center mb-6">
              <div className="text-white text-sm mb-3">Enter PIN</div>
              <div className="flex justify-center space-x-3 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 ${
                      i < userPin.length
                        ? "bg-green-400 border-green-400"
                        : "border-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((digit, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (digit === "⌫") {
                      clearPin();
                    } else if (digit !== "") {
                      handlePinEntry(digit.toString());
                    }
                  }}
                  className={`h-14 rounded-xl text-white font-semibold text-lg transition-all duration-200 ${
                    digit === ""
                      ? "cursor-default"
                      : "bg-white/10 hover:bg-white/20 active:scale-95"
                  }`}
                  disabled={digit === ""}
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-400/30">
            <div className="flex items-center justify-center text-white text-xs">
              <Shield className="w-4 h-4 text-red-400 mr-2" />
              <span className="font-medium">
                Secure PIN verification with behavioral analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render appropriate screen based on current step
  const renderCurrentScreen = () => {
    switch (currentStep) {
      case "demo":
        return <DemoScreen />;
      case "face-auth":
        return <FaceAuthScreen />;
      case "authenticating":
        return <AuthenticatingScreen />;
      case "step-up":
        return <StepUpScreen />;
      default:
        return <DemoScreen />;
    }
  };

  return renderCurrentScreen();
};

export default AuthenticationFlow;
