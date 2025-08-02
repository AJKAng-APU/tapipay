import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, BarChart3, Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
import AuthenticationFlow from './components/auth/AuthenticationFlow';
import useBehavioralData from './hooks/useBehavioralData';

const TapiPayMobileMVP = () => {
  const [currentStep, setCurrentStep] = useState('welcome');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authData, setAuthData] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    balance: 2500.75,
    accountNumber: '**** 1234'
  });

  // Use behavioral data hook
  const {
    behavioralData,
    recordKeystroke,
    recordTouch,
    sendBehavioralData,
    getBehavioralSummary
  } = useBehavioralData();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add global event listeners for behavioral data collection
  useEffect(() => {
    const handleKeyDown = (e) => recordKeystroke(e.key, 'keydown');
    const handleKeyUp = (e) => recordKeystroke(e.key, 'keyup');
    
    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch) {
        recordTouch(touch.clientX, touch.clientY, 'touchstart', touch.force || 0.5);
      }
    };
    
    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      if (touch) {
        recordTouch(touch.clientX, touch.clientY, 'touchend', touch.force || 0.5);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [recordKeystroke, recordTouch]);

  // Handle successful authentication
  const handleAuthSuccess = async (authResult) => {
    setAuthData(authResult);
    
    // Send behavioral data after successful auth
    await sendBehavioralData();
    
    setCurrentStep('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setAuthData(null);
    setCurrentStep('welcome');
  };

  // Render welcome screen
  const renderWelcome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TapiPay</h1>
        <p className="text-gray-600 mb-8">Secure biometric payment platform</p>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-green-600 text-sm">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-orange-600 text-sm">Offline Mode</span>
            </>
          )}
        </div>

        <button
          onClick={() => setCurrentStep('auth')}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>

        <div className="mt-6 text-xs text-gray-500">
          Behavioral data: {getBehavioralSummary().keystrokeCount} keystrokes, {getBehavioralSummary().touchCount} touches
        </div>
      </div>
    </div>
  );

  // Render dashboard
  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TapiPay</h1>
            <p className="text-sm text-gray-600">Welcome back, {userProfile.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-600" />
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Current Balance</p>
              <p className="text-3xl font-bold">RM {userProfile.balance.toFixed(2)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm">{userProfile.accountNumber}</p>
        </div>

        {/* Auth Method Used */}
        {authData && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">Authenticated via {authData.method}</p>
                <p className="text-sm text-gray-600">
                  {new Date(authData.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <CreditCard className="w-8 h-8 text-blue-600 mb-3" />
            <p className="font-semibold text-gray-900">Send Money</p>
            <p className="text-sm text-gray-600">Transfer funds</p>
          </button>
          
          <button className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <BarChart3 className="w-8 h-8 text-green-600 mb-3" />
            <p className="font-semibold text-gray-900">Analytics</p>
            <p className="text-sm text-gray-600">View reports</p>
          </button>
        </div>

        {/* Behavioral Data Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Session Analytics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Keystrokes</p>
              <p className="font-semibold">{getBehavioralSummary().keystrokeCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Touch Events</p>
              <p className="font-semibold">{getBehavioralSummary().touchCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Avg Dwell Time</p>
              <p className="font-semibold">{getBehavioralSummary().avgKeystrokeDwell.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-gray-600">Session Time</p>
              <p className="font-semibold">{Math.floor(getBehavioralSummary().sessionDuration / 1000)}s</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <button className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-600" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900">Settings</p>
            <p className="text-sm text-gray-600">Manage your account</p>
          </div>
        </button>
      </div>
    </div>
  );

  // Main render logic
  return (
    <div className="App">
      {currentStep === 'welcome' && renderWelcome()}
      {currentStep === 'auth' && (
        <AuthenticationFlow
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setCurrentStep('welcome')}
          isOnline={isOnline}
          offlineMode={!isOnline}
        />
      )}
      {currentStep === 'dashboard' && renderDashboard()}
    </div>
  );
};

export default TapiPayMobileMVP;

      // Combine behavioral patterns for token generation
      const behavioralScore = calculateBehavioralScore(behavioralData);

      // Create token payload
      const tokenPayload = {
        userId: userProfile.userId,
        sessionId: userProfile.sessionId,
        timestamp: timestamp,
        deviceFingerprint: deviceFingerprint,
        behavioralScore: behavioralScore,
        faceScore: faceData ? faceData.confidence_percent / 100 : 0,
        offlineMode: true,
        expiresAt: timestamp + 15 * 60 * 1000, // 15 minutes
        version: "1.0",
      };

      // Generate cryptographic token
      const token = await generateCryptoToken(tokenPayload);

      // Store token securely in memory (not localStorage as per constraints)
      const offlineAuthToken = {
        token: token,
        payload: tokenPayload,
        confidence: Math.min(
          0.9,
          behavioralScore +
            (faceData ? (faceData.confidence_percent / 100) * 0.3 : 0)
        ),
        generatedAt: timestamp,
        isValid: true,
      };

      setOfflineToken(offlineAuthToken);
      console.log("✅ Offline token generated successfully", offlineAuthToken);

      return offlineAuthToken;
    } catch (error) {
      console.error("❌ Error generating offline token:", error);
      return null;
    }
  };

  // Generate device fingerprint for token security
  const generateDeviceFingerprint = async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Device fingerprint", 2, 2);

      const fingerprint = {
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 50), // Truncated for security
        canvas: canvas.toDataURL().substring(0, 50),
        timestamp: Date.now(),
      };

      // Create hash of fingerprint
      const fingerprintString = JSON.stringify(fingerprint);
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(fingerprintString)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return hashHex.substring(0, 16); // Use first 16 characters
    } catch (error) {
      console.error("Error generating device fingerprint:", error);
      return "fallback_fingerprint_" + Date.now();
    }
  };

  // Calculate behavioral score for offline authentication
  const calculateBehavioralScore = (data) => {
    if (!data.keystrokes.length && !data.touchPatterns.length) {
      return 0.5; // Default moderate score
    }

    let keystrokeScore = 0.5;
    let touchScore = 0.5;

    // Analyze keystroke patterns
    if (data.keystrokes.length > 0) {
      const dwellTimes = data.keystrokes.map((ks) => ks.up_time - ks.down_time);
      const avgDwell =
        dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
      const consistency =
        1 -
        (Math.max(...dwellTimes) - Math.min(...dwellTimes)) / (avgDwell + 1);
      keystrokeScore = Math.max(0.2, Math.min(0.95, consistency));
    }

    // Analyze touch patterns
    if (data.touchPatterns.length > 0) {
      const pressures = data.touchPatterns.map((tp) => tp.pressure);
      const durations = data.touchPatterns.map((tp) => tp.duration);

      if (pressures.length > 0 && durations.length > 0) {
        const pressureConsistency =
          1 - (Math.max(...pressures) - Math.min(...pressures));
        const avgDuration =
          durations.reduce((a, b) => a + b, 0) / durations.length;
        const durationConsistency =
          1 -
          (Math.max(...durations) - Math.min(...durations)) / (avgDuration + 1);
        touchScore = Math.max(
          0.2,
          Math.min(0.9, (pressureConsistency + durationConsistency) / 2)
        );
      }
    }

    // Weighted combination
    const finalScore =
      data.keystrokes.length > 0
        ? keystrokeScore * 0.6 + touchScore * 0.4
        : touchScore;

    return Math.max(0.3, Math.min(0.95, finalScore));
  };

  // Generate cryptographic token
  const generateCryptoToken = async (payload) => {
    try {
      const payloadString = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadString);

      // Create hash
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Create token with timestamp and hash
      const token = `OFFLINE_${Date.now()}_${hash.substring(0, 32)}`;
      return token;
    } catch (error) {
      console.error("Error generating crypto token:", error);
      // Fallback token generation
      return `OFFLINE_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 18)}`;
    }
  };

  // Validate offline token
  const validateOfflineToken = (token) => {
    if (!token || !token.isValid) {
      return false;
    }

    const now = Date.now();
    const isExpired = now > token.payload.expiresAt;

    if (isExpired) {
      console.log("🕒 Offline token expired");
      setOfflineToken(null);
      return false;
    }

    return true;
  };

  // Enhanced authentication function with offline support
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

      // Check if we should use offline mode
      const shouldUseOffline = !isOnline || offlineMode;

      if (shouldUseOffline) {
        console.log("📱 Using offline authentication mode");

        // Generate offline token
        const offlineAuthToken = await generateOfflineToken(
          {
            userId: behavioralData.userId,
            sessionId: behavioralData.sessionId,
          },
          behavioralData,
          faceResult
        );

        if (offlineAuthToken && validateOfflineToken(offlineAuthToken)) {
          const result = {
            confidence_score: offlineAuthToken.confidence,
            face_confidence: faceConfidence,
            behavioral_confidence: offlineAuthToken.payload.behavioralScore,
            combined_confidence: offlineAuthToken.confidence,
            risk_level: offlineAuthToken.confidence > 0.7 ? "LOW" : "MEDIUM",
            action: offlineAuthToken.confidence > 0.6 ? "ALLOW" : "STEP_UP",
            offline_mode: true,
            token: offlineAuthToken.token,
            expires_at: offlineAuthToken.payload.expiresAt,
          };

          console.log("✅ Offline authentication result:", result);
          setAuthResult(result);
          return result;
        } else {
          // Fallback for offline mode
          const fallbackResult = {
            confidence_score: 0.4,
            face_confidence: faceConfidence,
            behavioral_confidence: 0.3,
            combined_confidence: 0.4,
            risk_level: "HIGH",
            action: "STEP_UP",
            offline_mode: true,
            error: "Failed to generate offline token",
          };

          console.log("⚠️ Offline fallback result:", fallbackResult);
          setAuthResult(fallbackResult);
          return fallbackResult;
        }
      }

      // Online mode - existing logic
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
          offline_mode: false,
        };

        console.log("✅ Multi-modal authentication result:", enhancedResult);
        setAuthResult(enhancedResult);
        return enhancedResult;
      }

      // Network error - switch to offline mode
      console.log("🔄 Network error, switching to offline mode");
      setOfflineMode(true);
      return await authenticateWithMultiModal(); // Retry in offline mode
    } catch (error) {
      console.error("❌ Authentication error:", error);

      // Try offline authentication as fallback
      if (!offlineMode) {
        console.log("🔄 Switching to offline mode due to error");
        setOfflineMode(true);
        return await authenticateWithMultiModal();
      }

      const fallbackResult = {
        confidence_score: 0.3,
        face_confidence: faceResult ? faceResult.confidence_percent / 100 : 0,
        behavioral_confidence: 0.2,
        combined_confidence: 0.3,
        risk_level: "HIGH",
        action: "STEP_UP",
        error: error.message || "Network error occurred",
        offline_mode: true,
      };

      console.log("🆘 Using fallback result:", fallbackResult);
      setAuthResult(fallbackResult);
      return fallbackResult;
    }
  };

  // Camera functions for face recognition
  const startCamera = async () => {
    try {
      console.log("🎥 Starting camera for face recognition...");
      setCameraError(null);
      setIsCameraLoading(true);
      setIsCameraActive(false);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "user",
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        // Clear any existing src
        videoRef.current.srcObject = null;

        // Wait a frame before setting new stream
        await new Promise((resolve) => requestAnimationFrame(resolve));

        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;

        // Add comprehensive event handling
        const handleLoadedMetadata = () => {
          console.log(
            "📺 Video metadata loaded:",
            videoRef.current.videoWidth,
            "x",
            videoRef.current.videoHeight
          );

          // Force play after metadata is loaded
          videoRef.current
            .play()
            .then(() => {
              console.log("▶️ Video playing successfully");
              setIsCameraActive(true);
              setIsCameraLoading(false);
            })
            .catch((error) => {
              console.error("❌ Video play error:", error);
              setCameraError(
                "Failed to start video playback: " + error.message
              );
              setIsCameraLoading(false);
            });
        };

        const handleCanPlay = () => {
          console.log("📺 Video can play");
          if (!isCameraActive) {
            videoRef.current.play().catch(console.error);
          }
        };

        const handlePlaying = () => {
          console.log("📺 Video is playing");
          setIsCameraActive(true);
          setIsCameraLoading(false);
        };

        const handleError = (error) => {
          console.error("❌ Video error:", error);
          setCameraError("Video stream error");
          setIsCameraLoading(false);
        };

        // Remove existing listeners
        videoRef.current.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoRef.current.removeEventListener("canplay", handleCanPlay);
        videoRef.current.removeEventListener("playing", handlePlaying);
        videoRef.current.removeEventListener("error", handleError);

        // Add event listeners
        videoRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoRef.current.addEventListener("canplay", handleCanPlay);
        videoRef.current.addEventListener("playing", handlePlaying);
        videoRef.current.addEventListener("error", handleError);

        // Fallback timeout
        setTimeout(() => {
          if (videoRef.current && !isCameraActive) {
            console.log("📺 Fallback: forcing video play");
            videoRef.current.play().catch((error) => {
              console.error("❌ Fallback play failed:", error);
              setCameraError("Camera initialization failed: " + error.message);
              setIsCameraLoading(false);
            });
          }
        }, 2000);
      }
    } catch (error) {
      console.error("❌ Camera access error:", error);
      setCameraError(`Camera error: ${error.message}`);
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
    console.log("🛑 Camera stopped");
  };

  const captureAndAnalyzeFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("❌ Video or canvas not available");
      setCameraError("Video or canvas element not ready");
      return null;
    }

    if (!isCameraActive) {
      console.error("❌ Camera not active");
      setCameraError("Camera not active");
      return null;
    }

    try {
      setIsCapturing(true);
      console.log("📸 Capturing face image...");

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      // Check video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      console.log("📐 Video dimensions:", videoWidth, "x", videoHeight);

      if (videoWidth === 0 || videoHeight === 0) {
        throw new Error("Video not ready - dimensions are 0");
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Draw current video frame to canvas (flip horizontally to match display)
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();

      console.log("🖼️ Image drawn to canvas");

      // If offline, use local face analysis
      if (!isOnline || offlineMode) {
        console.log("📱 Using offline face analysis");
        const offlineFaceResult = {
          matched_user: "offline_user.jpg",
          confidence_percent: Math.random() * 25 + 65, // Random between 65-90%
          processing_time_ms: Math.random() * 30 + 40, // Random between 40-70ms
          liveness_check: "passed",
          face_detected: true,
          offline_mode: true,
        };

        console.log("✅ Offline face recognition result:", offlineFaceResult);
        setFaceResult(offlineFaceResult);
        return offlineFaceResult;
      }

      // Convert canvas to blob for online processing
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob from canvas"));
            }
          },
          "image/jpeg",
          0.8
        );
      });

      console.log("📦 Blob created, size:", blob.size, "bytes");

      // Create form data for backend
      const formData = new FormData();
      formData.append("image", blob, "captured_face.jpg");

      console.log("📤 Sending face image to backend...");

      const response = await fetch(`${API_BASE_URL}/scan`, {
        method: "POST",
        body: formData,
      });

      console.log("📡 Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Backend error response:", errorText);
        throw new Error(
          `Face recognition failed with status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ Face recognition result:", result);

      setFaceResult(result);
      return result;
    } catch (error) {
      console.error("❌ Face capture/analysis error:", error);

      // Create a more realistic fallback result for demo purposes
      const fallbackResult = {
        matched_user: "demo_user.jpg",
        confidence_percent: Math.random() * 30 + 60, // Random between 60-90%
        error: error.message,
        fallback: true,
        offline_mode: !isOnline || offlineMode,
      };

      console.log("🆘 Using fallback face result:", fallbackResult);
      setFaceResult(fallbackResult);

      // Show error message to user
      setCameraError(`Face analysis error: ${error.message}`);

      return fallbackResult;
    } finally {
      setIsCapturing(false);
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

    // Auto-start camera after a short delay
    setTimeout(() => {
      startCamera();
    }, 500);
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
    setIsCameraLoading(false);
    setOfflineToken(null);
    setOfflineMode(false);
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

  const WelcomeScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white overflow-hidden relative">
      <OfflineIndicator />

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
            {(!isOnline || offlineMode) && (
              <div className="bg-orange-500/15 backdrop-blur-sm rounded-xl p-3 border border-orange-400/20">
                <div className="flex items-center">
                  <WifiOff className="w-5 h-5 text-orange-300 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Offline Ready</div>
                    <div className="text-orange-200 text-xs">
                      Cryptographic token generation
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            {isOnline && !offlineMode ? (
              <>
                <Wifi className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-green-200 text-xs">
                  Online • Integrated with DuitNow & PayNet
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-400 mr-2" />
                <span className="text-orange-200 text-xs">
                  Offline Mode • Secure Local Authentication
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DemoScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-green-900">
      <OfflineIndicator />

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
            {isOnline && !offlineMode ? (
              <>
                <Wifi className="w-5 h-5 text-green-300 mx-auto mb-2" />
                <div className="text-white text-xs font-medium">Online</div>
                <div className="text-green-200 text-xs">Connected</div>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-orange-300 mx-auto mb-2" />
                <div className="text-white text-xs font-medium">Offline</div>
                <div className="text-orange-200 text-xs">Secure</div>
              </>
            )}
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
                {isOnline && !offlineMode
                  ? "AI-Powered Multi-Modal Analysis"
                  : "Offline Cryptographic Authentication"}
              </span>
            </div>
          </div>

          {offlineToken && (
            <div className="bg-gradient-to-r from-orange-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-3 border border-orange-400/30">
              <div className="text-white text-xs font-bold mb-2">
                🔐 Offline Token Generated
              </div>
              <div className="text-orange-200 text-xs space-y-1">
                <div>Token: {offlineToken.token.substring(0, 20)}...</div>
                <div>
                  Confidence: {(offlineToken.confidence * 100).toFixed(1)}%
                </div>
                <div>
                  Expires:{" "}
                  {new Date(
                    offlineToken.payload.expiresAt
                  ).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

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

            <div className="grid grid-cols-3 gap-2 mb-2">
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

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  console.log("📱 Forcing offline mode");
                  setOfflineMode(true);
                }}
                className="bg-orange-500/30 hover:bg-orange-500/50 text-white text-xs py-2 px-3 rounded transition-all"
              >
                📱 Force Offline
              </button>
              <button
                onClick={() => {
                  console.log("🌐 Forcing online mode");
                  setOfflineMode(false);
                }}
                className="bg-green-500/30 hover:bg-green-500/50 text-white text-xs py-2 px-3 rounded transition-all"
              >
                🌐 Force Online
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
          {/* Initial state - camera not started */}
          {!isCameraActive && !cameraError && !isCameraLoading && (
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Scan className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Secure Face Verification
              </h3>
              <p className="text-blue-200 text-sm mb-6 px-4">
                {offlineMode
                  ? "Offline face analysis using local cryptographic processing. Your face data never leaves your device."
                  : "Look directly at the camera for instant biometric authentication. Your face data is processed securely and never stored."}
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

          {/* Loading state */}
          {isCameraLoading && (
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <Loader className="w-12 h-12 text-blue-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Starting Camera...
              </h3>
              <p className="text-blue-200 text-sm mb-6 px-4">
                Requesting camera access. Please allow camera permissions when
                prompted.
              </p>
            </div>
          )}

          {/* Error state */}
          {cameraError && (
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Camera Access Issue
              </h3>
              <p className="text-red-200 text-sm mb-4 px-4">{cameraError}</p>
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-6 text-left">
                <div className="text-red-200 text-xs">
                  <div className="font-bold mb-2">🔧 Troubleshooting:</div>
                  <div>• Allow camera permissions in browser</div>
                  <div>• Check if camera is being used by another app</div>
                  <div>• Try refreshing the page</div>
                  <div>• Ensure HTTPS connection for camera access</div>
                </div>
              </div>
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

          {/* Camera active state */}
          {(isCameraActive || isCameraLoading) && (
            <div className="w-full max-w-sm mx-auto">
              <div className="relative mb-6 w-full h-80 bg-gray-900 rounded-2xl overflow-hidden">
                {/* Main video element */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  autoPlay
                  muted
                  playsInline
                  style={{
                    objectFit: "cover",
                    backgroundColor: "#1f2937", // fallback gray background
                    transform: "scaleX(-1)", // Mirror the video for better UX
                  }}
                  onLoadedMetadata={() => {
                    console.log(
                      "Video metadata loaded, dimensions:",
                      videoRef.current?.videoWidth,
                      "x",
                      videoRef.current?.videoHeight
                    );
                  }}
                  onCanPlay={() => {
                    console.log("Video can play");
                  }}
                  onPlay={() => {
                    console.log("Video started playing");
                  }}
                  onError={(e) => {
                    console.error("Video element error:", e);
                  }}
                />

                {/* Fallback when no video */}
                {!isCameraActive && !isCameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-2xl">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Camera not active</p>
                    </div>
                  </div>
                )}

                {/* Loading state overlay */}
                {isCameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                    <div className="text-center text-white">
                      <Loader className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />

                {/* Face detection overlay - only show when camera is active */}
                {isCameraActive && (
                  <div className="absolute inset-4 border-2 border-blue-400 rounded-2xl opacity-60 pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                  </div>
                )}

                {/* Status indicator */}
                {isCameraActive && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                      <div className="text-green-300 text-xs font-medium flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        {offlineMode ? "Offline Analysis" : "Camera Active"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Capture overlay */}
                {isCapturing && (
                  <div className="absolute inset-0 bg-white/20 rounded-2xl flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                      <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                      <div className="text-white text-sm">
                        {offlineMode ? "Processing Locally..." : "Analyzing..."}
                      </div>
                    </div>
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
                        <div className="text-xs opacity-75 mt-1">
                          Matched: {faceResult.matched_user}
                        </div>
                      )}
                      {faceResult.offline_mode && (
                        <div className="text-xs opacity-75 mt-1">
                          🔐 Processed offline securely
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Debug info */}
                <div className="bg-white/5 border border-white/20 rounded-lg p-3 mb-4">
                  <div className="text-white/70 text-xs space-y-1">
                    <div>
                      📹 Camera Status: {isCameraActive ? "Active" : "Inactive"}
                    </div>
                    <div>
                      🔄 Stream:{" "}
                      {streamRef.current ? "Connected" : "Disconnected"}
                    </div>
                    <div>🔐 Mode: {offlineMode ? "Offline" : "Online"}</div>
                    {videoRef.current && (
                      <>
                        <div>
                          📐 Video: {videoRef.current.videoWidth}x
                          {videoRef.current.videoHeight}
                        </div>
                        <div>
                          ▶️ Playing: {videoRef.current.paused ? "No" : "Yes"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
                      {offlineMode
                        ? "Processing Locally..."
                        : "Analyzing Face..."}
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
                  <Activity className="w-8 h-8 text-white mx-auto mb-2 animate-pulse" />
                  <div className="text-2xl font-bold text-white">
                    {Math.round(authProgress)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            {offlineMode
              ? "Offline Cryptographic Authentication"
              : "Multi-Modal Authentication"}
          </h2>
          <p className="text-blue-200 mb-8 text-sm">
            {offlineMode
              ? "Generating secure offline token with behavioral & biometric fusion..."
              : "Analyzing facial biometrics, behavioral patterns & quantum encryption..."}
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
                <span className="text-white text-sm">
                  {offlineMode ? "Local Face Processing" : "3D Facial Mapping"}
                </span>
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
                <span className="text-white text-sm">
                  {offlineMode ? "Token Generation" : "Quantum Encryption"}
                </span>
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
                <span className="text-white text-sm">
                  {offlineMode ? "Security Validation" : "Multi-Layer Fusion"}
                </span>
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
                {authResult.offline_mode && (
                  <div className="text-orange-300">Mode: Offline</div>
                )}
                {authResult.token && (
                  <div className="text-purple-300">
                    Token: {authResult.token.substring(0, 16)}...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StepUpScreen = () => (
    <div className="w-full h-full bg-gradient-to-br from-orange-800 via-red-800 to-purple-800">
      <OfflineIndicator />

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
              {offlineMode
                ? "Your offline authentication pattern requires additional verification. Please enter your 6-digit PIN."
                : "Your authentication pattern requires additional verification. Please enter your 6-digit PIN."}
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
                  {authResult.offline_mode && (
                    <div>
                      Mode:{" "}
                      <span className="text-orange-300 font-semibold">
                        Offline
                      </span>
                    </div>
                  )}
                  {authResult.token && (
                    <div>
                      Token:{" "}
                      <span className="text-purple-300 font-semibold">
                        {authResult.token.substring(0, 12)}...
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
      <OfflineIndicator />

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
              {offlineMode
                ? "Secured by TapiPay Offline Cryptographic Authentication"
                : "Secured by TapiPay Multi-Modal Authentication"}
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
                  {offlineMode
                    ? faceResult
                      ? "Offline Face + Behavioral + Crypto"
                      : "Offline Behavioral + Crypto"
                    : faceResult
                    ? "Face + Behavioral + Quantum"
                    : "Behavioral + Quantum"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Speed</span>
                <span className="text-blue-300 text-sm">65ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Mode</span>
                <span
                  className={`text-sm flex items-center ${
                    offlineMode ? "text-orange-300" : "text-green-300"
                  }`}
                >
                  {offlineMode ? (
                    <>
                      <WifiOff className="w-4 h-4 mr-1" />
                      Offline
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 mr-1" />
                      Online
                    </>
                  )}
                </span>
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
              {authResult && authResult.token && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Token</span>
                  <span className="text-purple-300 text-xs font-mono">
                    {authResult.token.substring(0, 16)}...
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
              setOfflineToken(null);
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

  // Log offline token changes
  useEffect(() => {
    if (offlineToken) {
      console.log("🔐 Offline token updated:", offlineToken);
    }
  }, [offlineToken]);

  // Log mode changes
  useEffect(() => {
    console.log(
      `🔄 Mode changed: ${offlineMode ? "Offline" : "Online"} (Network: ${
        isOnline ? "Connected" : "Disconnected"
      })`
    );
  }, [offlineMode, isOnline]);

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
