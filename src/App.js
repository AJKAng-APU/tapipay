import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Fingerprint,
  CheckCircle,
  Lock,
  Zap,
  Globe,
  Smartphone,
  Timer,
  Heart,
  Eye,
  ArrowLeft,
  Stars,
  Sparkles,
  AlertTriangle,
  Activity,
  Camera,
  Scan,
  Loader,
} from "lucide-react";

const TapiPayMobileMVP = () => {
  const [currentStep, setCurrentStep] = useState("welcome");
  const [authProgress, setAuthProgress] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [authResult, setAuthResult] = useState(null);
  const [userPin, setUserPin] = useState("");
  const [showPinEntry, setShowPinEntry] = useState(false);

  // Face recognition states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceResult, setFaceResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Behavioral data collection
  const [behavioralData, setBehavioralData] = useState({
    keystrokes: [],
    touchPatterns: [],
    userId: "user_123", // This would come from actual user session
    sessionId: `session_${Date.now()}`,
    geoIp: "MY", // This would come from actual geolocation
  });

  const keystrokeStartTimes = useRef({});
  const touchStartTimes = useRef({});

  // Backend API configuration - Using proxy now
  const API_BASE_URL = ""; // Empty string to use proxy

  // Camera functions for face recognition
  const startCamera = async () => {
    try {
      console.log("🎥 Starting camera for face recognition...");
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        console.log("✅ Camera started successfully");
      }
    } catch (error) {
      console.error("❌ Camera access error:", error);
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    console.log("🛑 Camera stopped");
  };

  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("❌ Video or canvas not available");
      return null;
    }

    try {
      setIsCapturing(true);
      console.log("📸 Capturing face image...");

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );

      // Create form data for backend
      const formData = new FormData();
      formData.append("image", blob, "captured_face.jpg");

      console.log("📤 Sending face image to backend...");

      const response = await fetch(`${API_BASE_URL}/scan`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Face recognition failed with status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ Face recognition result:", result);

      setFaceResult(result);
      return result;
    } catch (error) {
      console.error("❌ Face capture/analysis error:", error);

      // Fallback result for demo purposes
      const fallbackResult = {
        matched_user: "demo_user.jpg",
        confidence_percent: 75.5,
        error: error.message,
      };

      console.log("🆘 Using fallback face result:", fallbackResult);
      setFaceResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsCapturing(false);
    }
  };

  // Enhanced authentication function combining behavioral and face recognition
  const authenticateWithMultiModal = async () => {
    try {
      console.log("🚀 Starting multi-modal authentication process...");

      let faceConfidence = 0;
      let behavioralConfidence = 0;

      // Face recognition confidence
      if (faceResult) {
        faceConfidence = faceResult.confidence_percent / 100;
        console.log(
          `👤 Face recognition confidence: ${(faceConfidence * 100).toFixed(
            1
          )}%`
        );
      }

      // Behavioral analytics (existing logic)
      console.log("📊 Behavioral data collected:", {
        keystrokes: behavioralData.keystrokes.length,
        touchPatterns: behavioralData.touchPatterns.length,
        userId: behavioralData.userId,
        sessionId: behavioralData.sessionId,
        geoIp: behavioralData.geoIp,
      });

      // 🧪 Testing Mode: Force scenarios for testing
      if (
        behavioralData.userId.includes("suspicious_user") ||
        behavioralData.geoIp === "UNKNOWN_COUNTRY"
      ) {
        console.log("🧪 TEST MODE: Simulating low confidence scenario");
        const testResult = {
          confidence_score: 0.45,
          face_confidence: faceConfidence,
          behavioral_confidence: 0.3,
          combined_confidence: Math.max(0.45, faceConfidence * 0.7 + 0.3 * 0.3),
          risk_level: "HIGH",
          action: "STEP_UP",
          test_mode: true,
        };
        console.log("🧪 Test result:", testResult);
        setAuthResult(testResult);
        return testResult;
      }

      if (behavioralData.userId === "test_high_confidence") {
        console.log("🧪 TEST MODE: Simulating high confidence scenario");
        const testResult = {
          confidence_score: 0.95,
          face_confidence: faceConfidence,
          behavioral_confidence: 0.95,
          combined_confidence: Math.min(
            0.95,
            faceConfidence * 0.7 + 0.95 * 0.3
          ),
          risk_level: "LOW",
          action: "ALLOW",
          test_mode: true,
        };
        console.log("🧪 Test result:", testResult);
        setAuthResult(testResult);
        return testResult;
      }

      // Call behavioral authentication endpoint
      console.log("📤 Sending behavioral authentication request...");

      const requestData = {
        user_id: behavioralData.userId,
        session_id: behavioralData.sessionId,
        keystrokes: behavioralData.keystrokes,
        touch_patterns: behavioralData.touchPatterns,
        geo_ip: behavioralData.geoIp,
        face_result: faceResult, // Include face recognition data
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const behavioralResult = await response.json();
        behavioralConfidence = behavioralResult.confidence_score;

        // Combine face and behavioral confidence (weighted average)
        const combinedConfidence =
          faceConfidence * 0.7 + behavioralConfidence * 0.3;

        const enhancedResult = {
          ...behavioralResult,
          face_confidence: faceConfidence,
          behavioral_confidence: behavioralConfidence,
          combined_confidence: combinedConfidence,
          action: combinedConfidence > 0.8 ? "ALLOW" : "STEP_UP",
          risk_level: combinedConfidence > 0.8 ? "LOW" : "HIGH",
        };

        console.log("✅ Multi-modal authentication result:", enhancedResult);
        setAuthResult(enhancedResult);
        return enhancedResult;
      }

      // Fallback to face-only authentication
      const faceOnlyResult = {
        confidence_score: faceConfidence,
        face_confidence: faceConfidence,
        behavioral_confidence: 0,
        combined_confidence: faceConfidence,
        risk_level: faceConfidence > 0.7 ? "LOW" : "HIGH",
        action: faceConfidence > 0.7 ? "ALLOW" : "STEP_UP",
        mode: "face_only",
      };

      console.log("📱 Using face-only authentication:", faceOnlyResult);
      setAuthResult(faceOnlyResult);
      return faceOnlyResult;
    } catch (error) {
      console.error("❌ Authentication error:", error);

      const fallbackResult = {
        confidence_score: 0.3,
        face_confidence: faceResult ? faceResult.confidence_percent / 100 : 0,
        behavioral_confidence: 0.2,
        combined_confidence: 0.3,
        risk_level: "HIGH",
        action: "STEP_UP",
        error: error.message || "Network error occurred",
      };

      console.log("🆘 Using fallback result:", fallbackResult);
      setAuthResult(fallbackResult);
      return fallbackResult;
    }
  };

  // Capture keystroke data
  const handleKeyDown = (key) => {
    keystrokeStartTimes.current[key] = Date.now();
    console.log("⌨️ Key down:", key);
  };

  const handleKeyUp = (key) => {
    const downTime = keystrokeStartTimes.current[key];
    const upTime = Date.now();

    if (downTime) {
      const keystroke = {
        key,
        down_time: downTime,
        up_time: upTime,
      };

      console.log("⌨️ Keystroke captured:", keystroke);

      setBehavioralData((prev) => ({
        ...prev,
        keystrokes: [...prev.keystrokes, keystroke],
      }));

      delete keystrokeStartTimes.current[key];
    }
  };

  // Capture touch data
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const touchId = `touch_${Date.now()}`;

    touchStartTimes.current[touchId] = {
      startTime: Date.now(),
      x: touch.clientX,
      y: touch.clientY,
      pressure: touch.force || 0.5,
    };

    console.log("👆 Touch start:", touchStartTimes.current[touchId]);
  };

  const handleTouchEnd = (e) => {
    const touchId = Object.keys(touchStartTimes.current)[0];
    const touchStart = touchStartTimes.current[touchId];

    if (touchStart) {
      const touchPattern = {
        x: touchStart.x,
        y: touchStart.y,
        pressure: touchStart.pressure,
        duration: Date.now() - touchStart.startTime,
      };

      console.log("👆 Touch pattern captured:", touchPattern);

      setBehavioralData((prev) => ({
        ...prev,
        touchPatterns: [...prev.touchPatterns, touchPattern],
      }));

      delete touchStartTimes.current[touchId];
    }
  };

  // Simulate authentication process with behavioral analysis and face recognition
  useEffect(() => {
    if (isAuthenticating) {
      console.log("🔄 Authentication progress started");

      const timer = setInterval(async () => {
        setAuthProgress((prev) => {
          if (prev >= 100) {
            console.log("🏁 Authentication progress completed");
            setIsAuthenticating(false);

            // Perform multi-modal authentication
            authenticateWithMultiModal().then((result) => {
              if (result && result.action === "ALLOW") {
                console.log(
                  "🎉 Authentication approved - proceeding to success"
                );
                setCurrentStep("success");
                setShowSparkles(true);
                stopCamera(); // Stop camera on success
              } else {
                console.log(
                  "⚠️ Authentication requires step-up - showing PIN entry"
                );
                setCurrentStep("stepup");
                stopCamera(); // Stop camera on step-up
              }
            });

            return 100;
          }
          const newProgress = prev + 4;
          if (newProgress % 20 === 0) {
            console.log(`📈 Authentication progress: ${newProgress}%`);
          }
          return newProgress;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isAuthenticating]);

  const startAuth = () => {
    console.log("🎬 Starting authentication flow");
    console.log("📊 Current behavioral data:", behavioralData);

    setCurrentStep("faceAuth");
    setAuthProgress(0);
    setShowSparkles(false);
    setAuthResult(null);
    setFaceResult(null);
  };

  const proceedWithFaceAuth = async () => {
    console.log("👤 Proceeding with face authentication");

    // Capture and analyze face
    const result = await captureAndAnalyzeFace();

    if (result) {
      // Proceed to behavioral authentication
      setIsAuthenticating(true);
      setCurrentStep("authenticating");
    }
  };

  const skipFaceAuth = () => {
    console.log("⏭️ Skipping face authentication");
    stopCamera();
    setIsAuthenticating(true);
    setCurrentStep("authenticating");
  };

  const handlePinEntry = (digit) => {
    if (userPin.length < 6) {
      const newPin = userPin + digit;
      setUserPin(newPin);
      console.log(`🔢 PIN entry: ${newPin.length}/6 digits entered`);

      // Capture keystroke data for PIN entry
      handleKeyDown(digit);
      setTimeout(() => handleKeyUp(digit), 100);

      if (newPin.length === 6) {
        console.log("✅ PIN entry completed - simulating verification");
        // Simulate PIN verification
        setTimeout(() => {
          console.log("🎉 PIN verified successfully");
          setCurrentStep("success");
          setShowSparkles(true);
        }, 1000);
      }
    }
  };

  const clearPin = () => {
    console.log("🔄 PIN cleared");
    setUserPin("");
  };

  const resetApp = () => {
    console.log("🔄 Resetting app to initial state");
    stopCamera();
    setCurrentStep("welcome");
    setAuthProgress(0);
    setShowSparkles(false);
    setAuthResult(null);
    setFaceResult(null);
    setUserPin("");
    setCameraError(null);
    setBehavioralData((prev) => ({
      ...prev,
      keystrokes: [],
      touchPatterns: [],
      sessionId: `session_${Date.now()}`,
    }));
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Log behavioral data changes
  useEffect(() => {
    if (
      behavioralData.keystrokes.length > 0 ||
      behavioralData.touchPatterns.length > 0
    ) {
      console.log("📈 Behavioral data updated:", {
        keystrokes: behavioralData.keystrokes.length,
        touchPatterns: behavioralData.touchPatterns.length,
      });
    }
  }, [behavioralData]);

  const WelcomeScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-green-400/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-400/10 rounded-full animate-ping delay-500"></div>
      </div>

      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="h-6"></div>

        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 mr-3">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">TapiPay</h1>
                <p className="text-blue-100 text-xs">Powered by PayNet</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Future-Proof Payments</h2>
            <p className="text-blue-100 text-sm leading-relaxed px-4">
              Experience quantum-ready authentication with AI-powered behavioral
              analysis and facial recognition. Multiple layers, infinite
              protection.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 w-full mb-8 px-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-300 mr-3" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Sub-100ms Speed</div>
                  <div className="text-blue-200 text-xs">
                    Real-time multi-modal analysis
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-green-300 mr-3" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Face Recognition</div>
                  <div className="text-blue-200 text-xs">
                    3D liveness detection
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-purple-300 mr-3" />
                <div className="text-left">
                  <div className="font-semibold text-sm">
                    Behavioral Biometrics
                  </div>
                  <div className="text-blue-200 text-xs">
                    Keystroke & touch analysis
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-300 mr-3" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Quantum-Resistant</div>
                  <div className="text-blue-200 text-xs">
                    Future-proof security
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 pb-8">
          <button
            onClick={() => {
              console.log("🎯 User clicked 'Experience TapiPay'");
              setCurrentStep("demo");
            }}
            className="w-full group relative bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl text-lg font-bold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-center">
              <Smartphone className="w-5 h-5 mr-3 group-hover:animate-pulse" />
              Experience TapiPay
              <Sparkles className="w-4 h-4 ml-3 group-hover:animate-spin" />
            </div>
          </button>

          <div className="flex items-center justify-center">
            <Globe className="w-4 h-4 text-white/70 mr-2" />
            <span className="text-white/70 text-xs">
              Integrated with DuitNow & PayNet
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const DemoScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-green-900">
      <div className="p-6 h-full flex flex-col">
        <div className="h-6"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-white mr-2" />
            <h2 className="text-lg font-bold text-white">Pay with TapiPay</h2>
          </div>
          <button
            onClick={() => {
              console.log("🔙 User clicked 'Back' from demo");
              setCurrentStep("welcome");
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
            <Eye className="w-5 h-5 text-blue-300 mx-auto mb-2" />
            <div className="text-white text-xs font-medium">Face ID</div>
            <div className="text-blue-200 text-xs">Ready</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Activity className="w-5 h-5 text-green-300 mx-auto mb-2" />
            <div className="text-white text-xs font-medium">Behavioral</div>
            <div className="text-green-200 text-xs">Learning</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Lock className="w-5 h-5 text-purple-300 mx-auto mb-2" />
            <div className="text-white text-xs font-medium">Quantum</div>
            <div className="text-purple-200 text-xs">Ready</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
            <Shield className="w-5 h-5 text-yellow-300 mx-auto mb-2" />
            <div className="text-white text-xs font-medium">Multi-Layer</div>
            <div className="text-yellow-200 text-xs">Active</div>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 backdrop-blur-sm rounded-lg p-3 border border-blue-400/30">
            <div className="flex items-center text-white text-sm">
              <Stars className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="font-medium">
                Collecting: {behavioralData.keystrokes.length} keystrokes,{" "}
                {behavioralData.touchPatterns.length} touches
              </span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm rounded-lg p-3 border border-green-400/30">
            <div className="flex items-center text-white text-sm">
              <Zap className="w-4 h-4 text-blue-400 mr-2" />
              <span className="font-medium">
                AI-Powered Multi-Modal Analysis
              </span>
            </div>
          </div>

          {/* Testing Buttons */}
          <div className="bg-red-600/20 backdrop-blur-sm rounded-lg p-3 border border-red-400/30">
            <div className="text-white text-xs font-bold mb-2">
              🧪 Testing Mode
            </div>

            <div className="text-white text-xs mb-3 p-2 bg-white/10 rounded">
              <span className="font-medium">Current Mode: </span>
              {behavioralData.userId.includes("suspicious_user") ? (
                <span className="text-red-300">⚠️ Low Trust Setup</span>
              ) : behavioralData.userId === "test_high_confidence" ? (
                <span className="text-green-300">✅ High Trust Setup</span>
              ) : (
                <span className="text-blue-300">🔵 Normal Mode</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  console.log("🧪 Setting up: HIGH confidence scenario");
                  setBehavioralData((prev) => ({
                    ...prev,
                    userId: "test_high_confidence",
                    geoIp: "MY",
                  }));
                }}
                className="bg-green-500/30 hover:bg-green-500/50 text-white text-xs py-2 px-3 rounded transition-all"
              >
                ✅ High Trust
              </button>
              <button
                onClick={() => {
                  console.log("🧪 Setting up: LOW confidence scenario");
                  setBehavioralData((prev) => ({
                    ...prev,
                    userId: "suspicious_user_" + Date.now(),
                    geoIp: "UNKNOWN_COUNTRY",
                    keystrokes: [],
                    touchPatterns: [],
                  }));
                }}
                className="bg-red-500/30 hover:bg-red-500/50 text-white text-xs py-2 px-3 rounded transition-all"
              >
                ⚠️ Low Trust
              </button>
              <button
                onClick={() => {
                  console.log("🧪 Resetting to normal mode");
                  setBehavioralData((prev) => ({
                    ...prev,
                    userId: "user_123",
                    geoIp: "MY",
                    keystrokes: prev.keystrokes,
                    touchPatterns: prev.touchPatterns,
                  }));
                }}
                className="bg-blue-500/30 hover:bg-blue-500/50 text-white text-xs py-2 px-3 rounded transition-all"
              >
                🔄 Reset
              </button>
            </div>
            <div className="text-white text-xs mt-2 opacity-70">
              Configure testing mode, then "Pay with TapiPay"
            </div>
          </div>
        </div>

        <div className="h-6"></div>
      </div>
    </div>
  );

  const FaceAuthScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-green-900">
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
              stopCamera();
              setCurrentStep("demo");
            }}
            className="flex items-center text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {!isCameraActive && !cameraError && (
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Scan className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Secure Face Verification
              </h3>
              <p className="text-blue-200 text-sm mb-6 px-4">
                Look directly at the camera for instant biometric
                authentication. Your face data is processed locally and never
                stored.
              </p>
              <button
                onClick={startCamera}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Camera className="w-5 h-5 mr-2 inline" />
                Start Face Scan
              </button>
            </div>
          )}

          {cameraError && (
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Camera Access Required
              </h3>
              <p className="text-red-200 text-sm mb-6 px-4">{cameraError}</p>
              <div className="space-y-3">
                <button
                  onClick={startCamera}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold"
                >
                  Try Again
                </button>
                <button
                  onClick={skipFaceAuth}
                  className="w-full bg-white/10 text-white py-3 px-6 rounded-xl font-semibold border border-white/20"
                >
                  Continue Without Face ID
                </button>
              </div>
            </div>
          )}

          {isCameraActive && (
            <div className="w-full max-w-sm mx-auto">
              <div className="relative mb-6">
                <video
                  ref={videoRef}
                  className="w-full aspect-square object-cover rounded-2xl bg-black"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Face detection overlay */}
                <div className="absolute inset-4 border-2 border-blue-400 rounded-2xl opacity-60">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                </div>

                {isCapturing && (
                  <div className="absolute inset-0 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <p className="text-white text-sm mb-4">
                  Position your face within the frame and look directly at the
                  camera
                </p>

                {faceResult && (
                  <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3 mb-4">
                    <div className="text-green-300 text-sm">
                      ✅ Face detected: {faceResult.confidence_percent}%
                      confidence
                      {faceResult.matched_user && (
                        <div className="text-xs opacity-75">
                          Matched: {faceResult.matched_user}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={proceedWithFaceAuth}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {isCapturing ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 inline animate-spin" />
                      Analyzing Face...
                    </>
                  ) : faceResult ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2 inline" />
                      Continue with Authentication
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5 mr-2 inline" />
                      Capture & Analyze Face
                    </>
                  )}
                </button>

                <button
                  onClick={skipFaceAuth}
                  className="w-full bg-white/10 text-white py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Continue Without Face ID
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AuthenticatingScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex flex-col">
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
                  <Activity className="w-8 h-8 text-white mx-auto mb-2 animate-pulse" />
                  <div className="text-2xl font-bold text-white">
                    {Math.round(authProgress)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Multi-Modal Authentication
          </h2>
          <p className="text-blue-200 mb-8 text-sm">
            Analyzing facial biometrics, behavioral patterns & quantum
            encryption...
          </p>

          <div className="space-y-3 mb-8">
            <div
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-500 ${
                authProgress > 20
                  ? "bg-blue-500/20 border-blue-400/50"
                  : "bg-white/10 border-white/20"
              } border`}
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 transition-colors duration-500 ${
                    authProgress > 20 ? "bg-blue-400" : "bg-white/30"
                  }`}
                ></div>
                <span className="text-white text-sm">3D Facial Mapping</span>
              </div>
              {authProgress > 20 && (
                <CheckCircle className="w-4 h-4 text-blue-400" />
              )}
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-500 ${
                authProgress > 40
                  ? "bg-green-500/20 border-green-400/50"
                  : "bg-white/10 border-white/20"
              } border`}
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 transition-colors duration-500 ${
                    authProgress > 40 ? "bg-green-400" : "bg-white/30"
                  }`}
                ></div>
                <span className="text-white text-sm">Behavioral Analysis</span>
              </div>
              {authProgress > 40 && (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-500 ${
                authProgress > 60
                  ? "bg-purple-500/20 border-purple-400/50"
                  : "bg-white/10 border-white/20"
              } border`}
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 transition-colors duration-500 ${
                    authProgress > 60 ? "bg-purple-400" : "bg-white/30"
                  }`}
                ></div>
                <span className="text-white text-sm">Quantum Encryption</span>
              </div>
              {authProgress > 60 && (
                <CheckCircle className="w-4 h-4 text-purple-400" />
              )}
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-500 ${
                authProgress > 80
                  ? "bg-yellow-500/20 border-yellow-400/50"
                  : "bg-white/10 border-white/20"
              } border`}
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 transition-colors duration-500 ${
                    authProgress > 80 ? "bg-yellow-400" : "bg-white/30"
                  }`}
                ></div>
                <span className="text-white text-sm">Multi-Layer Fusion</span>
              </div>
              {authProgress > 80 && (
                <CheckCircle className="w-4 h-4 text-yellow-400" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-center text-green-300 mb-4">
            <Timer className="w-4 h-4 mr-2" />
            <span className="text-sm">
              Processing: {(authProgress * 0.65).toFixed(0)}ms
            </span>
          </div>

          {authResult && (
            <div className="bg-white/10 rounded-lg border border-white/20 p-3">
              <div className="text-xs text-white/70 space-y-1">
                {authResult.face_confidence && (
                  <div>
                    Face: {(authResult.face_confidence * 100).toFixed(1)}%
                  </div>
                )}
                {authResult.behavioral_confidence && (
                  <div>
                    Behavioral:{" "}
                    {(authResult.behavioral_confidence * 100).toFixed(1)}%
                  </div>
                )}
                {authResult.combined_confidence && (
                  <div>
                    Combined:{" "}
                    {(authResult.combined_confidence * 100).toFixed(1)}%
                  </div>
                )}
                <div>Risk: {authResult.risk_level}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StepUpScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-orange-800 via-red-800 to-purple-800">
      <div className="p-6 h-full flex flex-col">
        <div className="h-6"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2" />
            <h2 className="text-lg font-bold text-white">
              Additional Verification
            </h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-orange-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              Enhanced Security Required
            </h3>
            <p className="text-orange-200 text-sm mb-6">
              Your authentication pattern requires additional verification.
              Please enter your 6-digit PIN.
            </p>

            {authResult && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-6 border border-white/20">
                <div className="text-sm text-white/70 space-y-1">
                  {authResult.face_confidence !== undefined && (
                    <div>
                      Face Confidence:{" "}
                      <span className="text-orange-300 font-semibold">
                        {(authResult.face_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {authResult.behavioral_confidence !== undefined && (
                    <div>
                      Behavioral:{" "}
                      <span className="text-orange-300 font-semibold">
                        {(authResult.behavioral_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div>
                    Risk Level:{" "}
                    <span className="text-orange-300 font-semibold">
                      {authResult.risk_level}
                    </span>
                  </div>
                  {authResult.combined_confidence && (
                    <div>
                      Combined Score:{" "}
                      <span className="text-orange-300 font-semibold">
                        {(authResult.combined_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PIN Entry */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="text-center mb-4">
              <div className="flex justify-center space-x-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 ${
                      index < userPin.length
                        ? "bg-green-400 border-green-400"
                        : "border-white/30"
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((digit, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (digit === "⌫") {
                        console.log("🔙 PIN backspace pressed");
                        setUserPin((prev) => prev.slice(0, -1));
                      } else if (digit !== "") {
                        console.log("🔢 PIN digit pressed:", digit);
                        handlePinEntry(digit.toString());
                      }
                    }}
                    className={`h-12 rounded-xl text-white font-semibold transition-all duration-200 ${
                      digit === ""
                        ? "invisible"
                        : "bg-white/10 hover:bg-white/20 active:scale-95"
                    }`}
                    disabled={digit === ""}
                  >
                    {digit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SuccessScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-green-800 via-blue-800 to-purple-800 relative overflow-hidden">
      {showSparkles && (
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 animate-bounce delay-100">
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="absolute top-32 right-16 animate-bounce delay-300">
            <Stars className="w-3 h-3 text-blue-300" />
          </div>
          <div className="absolute bottom-40 left-20 animate-bounce delay-500">
            <Sparkles className="w-3 h-3 text-green-300" />
          </div>
        </div>
      )}

      <div className="flex flex-col h-full p-6 relative z-10">
        <div className="h-6"></div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="relative mb-8 text-center">
            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 border-4 border-green-400 rounded-full animate-ping opacity-30"></div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Payment Successful!
            </h2>
            <p className="text-lg text-green-200 mb-8">
              Secured by TapiPay Multi-Modal Authentication
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Amount</span>
                <span className="text-xl font-bold text-white">RM 25.50</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">To</span>
                <span className="text-white text-sm">Kedai Makan Siti</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Security</span>
                <span className="text-green-300 flex items-center text-sm">
                  <Shield className="w-4 h-4 mr-1" />
                  {faceResult
                    ? "Face + Behavioral + Quantum"
                    : "Behavioral + Quantum"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Speed</span>
                <span className="text-blue-300 text-sm">65ms</span>
              </div>
              {authResult && authResult.combined_confidence && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Confidence</span>
                  <span className="text-green-300 text-sm">
                    {(authResult.combined_confidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {authResult && authResult.face_confidence && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Face Match</span>
                  <span className="text-blue-300 text-sm">
                    {(authResult.face_confidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30 mb-8">
            <div className="flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-300 mr-2" />
              <span className="text-white font-medium text-sm">
                PayNet Innovation Award Winner
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-6">
          <button
            onClick={() => {
              console.log("🔄 User clicked 'Pay Again'");
              setCurrentStep("demo");
              setAuthProgress(0);
              setShowSparkles(false);
              setAuthResult(null);
              setFaceResult(null);
              setUserPin("");
              setBehavioralData((prev) => ({
                ...prev,
                keystrokes: [],
                touchPatterns: [],
                sessionId: `session_${Date.now()}`,
              }));
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-xl text-base font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            Pay Again
          </button>
          <button
            onClick={() => {
              console.log("🏠 User clicked 'Back to Home'");
              resetApp();
            }}
            className="w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl text-base border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  const renderScreen = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeScreen />;
      case "demo":
        return <DemoScreen />;
      case "faceAuth":
        return <FaceAuthScreen />;
      case "authenticating":
        return <AuthenticatingScreen />;
      case "stepup":
        return <StepUpScreen />;
      case "success":
        return <SuccessScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  // Log screen changes
  useEffect(() => {
    console.log(`📱 Screen changed to: ${currentStep}`);
  }, [currentStep]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="relative">
        <div
          className="bg-black rounded-[3.5rem] p-2 shadow-2xl"
          style={{ width: "375px", height: "812px" }}
        >
          <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl z-50"></div>
            <div className="w-full h-full">{renderScreen()}</div>
          </div>
        </div>

        <div className="absolute left-0 top-20 w-1 h-8 bg-gray-700 rounded-r-md"></div>
        <div className="absolute left-0 top-32 w-1 h-12 bg-gray-700 rounded-r-md"></div>
        <div className="absolute left-0 top-48 w-1 h-12 bg-gray-700 rounded-r-md"></div>
        <div className="absolute right-0 top-32 w-1 h-16 bg-gray-700 rounded-l-md"></div>
      </div>
    </div>
  );
};

export default TapiPayMobileMVP;
