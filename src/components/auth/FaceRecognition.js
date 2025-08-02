import React, { useState, useRef, useEffect } from 'react';
import { Camera, Scan, Loader, AlertTriangle } from 'lucide-react';

const FaceRecognition = ({ 
  onSuccess, 
  onError, 
  onSkip,
  isOnline = true
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const offlineMode = !isOnline;
  
  // Click detection state for demo button
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    console.log('📷 Starting camera...');
    setIsCameraLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', 
            videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setIsCameraActive(true);
          setIsCameraLoading(false);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };
        
        videoRef.current.onplay = () => {
          console.log('Video started playing');
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
          setCameraError('Video playback error');
          setIsCameraLoading(false);
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Unable to access camera. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      }
      
      setCameraError(errorMessage);
      setIsCameraLoading(false);
      onError?.(error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    console.log('🚫 Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
    setCameraError(null);
  };

  // Handle face recognition demo with single/double click detection
  const handleFaceRecognitionDemo = (success) => {
    if (success) {
      simulateSuccessfulFaceRecognition();
    } else {
      simulateFailedFaceRecognition();
    }
  };

  // Single/Double click handler for demo button
  const handleDemoButtonClick = () => {
    setClickCount(prev => prev + 1);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      if (clickCount === 1) {
        // Single click - simulate successful face recognition
        console.log('👆 Single click detected - simulating successful face recognition');
        handleFaceRecognitionDemo(true);
      } else {
        // Double click - simulate failed face recognition
        console.log('👆👆 Double click detected - simulating failed face recognition');
        handleFaceRecognitionDemo(false);
      }
      setClickCount(0);
    }, 300); // 300ms timeout to detect double click
  };

  // Manual demo - simulate successful face recognition
  const simulateSuccessfulFaceRecognition = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    setIsCapturing(true);
    setCaptureProgress(0);
    console.log('📸 Demo: Simulating SUCCESSFUL face recognition...');

    // Capture current frame
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Simulate processing time with progress
    const progressInterval = setInterval(() => {
      setCaptureProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // Simulate processing delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setCaptureProgress(100);
      
      // Simulate successful face recognition result
      const faceResult = {
        success: true,
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        imageData: imageData,
        boundingBox: {
          x: video.videoWidth * 0.3,
          y: video.videoHeight * 0.2,
          width: video.videoWidth * 0.4,
          height: video.videoHeight * 0.5
        }
      };
      
      console.log('✅ Demo: Face recognition successful!', faceResult);
      setIsCapturing(false);
      setCaptureProgress(0);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(faceResult);
      }
    }, 2000);
  };

  // Manual demo - simulate failed face recognition
  const simulateFailedFaceRecognition = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    setIsCapturing(true);
    setCaptureProgress(0);
    console.log('📸 Demo: Simulating FAILED face recognition...');

    // Capture current frame
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Simulate processing time with progress
    const progressInterval = setInterval(() => {
      setCaptureProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // Simulate processing delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setCaptureProgress(100);
      
      // Simulate failed face recognition result
      const faceResult = {
        success: false,
        confidence: 0.35,
        timestamp: new Date().toISOString(),
        imageData: imageData,
        error: 'Face not clearly visible or recognized'
      };

      console.log('❌ Demo: Face recognition failed!', faceResult);
      setIsCapturing(false);
      setCaptureProgress(0);
      
      // Call error callback to trigger step-up authentication
      if (onError) {
        onError(new Error('Face recognition failed - demo'));
      }
    }, 2000);
  };

  // Skip face authentication
  const skipFaceAuth = () => {
    console.log('⏭️ User skipped face authentication');
    stopCamera();
    onSkip?.();
  };

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('🔄 Component unmounting, cleaning up camera...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Remove auto-capture for manual demo mode
  // useEffect(() => {
  //   if (isCameraActive && !isCapturing) {
  //     const autoCapture = setTimeout(() => {
  //       captureAndAnalyzeFace();
  //     }, 2000); // Auto-capture after 2 seconds
  //     
  //     return () => clearTimeout(autoCapture);
  //   }
  // }, [isCameraActive, isCapturing]);

  // Render the face recognition interface
  return (
    <>
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
            Requesting camera access. Please allow camera permissions when prompted.
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

            {/* Capture progress overlay */}
            {isCapturing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                <div className="text-center text-white">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="#3B82F6"
                        strokeWidth="6"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={`${captureProgress * 2.83} 283`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold">{Math.round(captureProgress)}%</span>
                    </div>
                  </div>
                  <p className="text-sm">Analyzing face...</p>
                </div>
              </div>
            )}
          </div>

          {/* Single Demo Button with Click Detection */}
          <div className="space-y-3">
            {isCameraActive && !isCapturing && (
              <>
                <button
                  onClick={handleDemoButtonClick}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Scan className="w-5 h-5 mr-2 inline" />
                  Face Recognition Demo
                </button>
              </>
            )}
            
            <button
              onClick={skipFaceAuth}
              className="w-full bg-white/10 text-white py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Skip Face Recognition
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-blue-200 text-xs">
              {offlineMode 
                ? "Face data processed locally for privacy"
                : "Secure biometric authentication in progress"}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FaceRecognition;
