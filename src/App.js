import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CreditCard,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  QrCode,
  Camera,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import AuthenticationFlow from "./components/auth/AuthenticationFlow";
import useBehavioralData from "./hooks/useBehavioralData";

const TapiPayMobileMVP = () => {
  console.log("🚀 TapiPay component initializing...");

  try {
    const [currentStep, setCurrentStep] = useState("welcome");
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineMode, setOfflineMode] = useState(false);
    const [authData, setAuthData] = useState(null);
    const [userProfile, setUserProfile] = useState({
      name: "John Doe",
      balance: 2500.75,
      accountNumber: "**** 1234",
      bank: "grabpay",
      securityKey: "ABCD123",
    });

    // Simplified offline system state (no deposits)
    const [offlineDepositSystem, setOfflineDepositSystem] = useState({
      isActive: false,
      creditScore: 850,
      creditRatio: "1:9", // Kept for compatibility
      depositRate: 0, // No deposit rate
      totalDeposits: 0, // No deposits
      availableBalance: 0,
      lockedAmount: 0,
      activatedTimestamp: null,
    });

    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentRecipient, setPaymentRecipient] = useState("");
    const [paymentFormAmount, setPaymentFormAmount] = useState("");
    const [paymentFormRecipient, setPaymentFormRecipient] = useState("");
    const [paymentFormAccountNumber, setPaymentFormAccountNumber] =
      useState("");
    const [paymentFormBank, setPaymentFormBank] = useState("");
    const [paymentFormReference, setPaymentFormReference] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Enhanced token deduction prevention system
    const [paymentResult, setPaymentResult] = useState(null);
    const paymentProcessedRef = useRef(false);

    // QR Code and Settings state
    const [qrData, setQrData] = useState(null);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [isQrScanned, setIsQrScanned] = useState(false);

    // Signature page state (offline only)
    const [signatureData, setSignatureData] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [signatureComplete, setSignatureComplete] = useState(false);

    console.log("✅ State initialization successful");

    // Use behavioral data hook
    let behavioralData,
      recordKeystroke,
      recordTouch,
      sendBehavioralData,
      getBehavioralSummary;
    try {
      const hookResult = useBehavioralData();
      behavioralData = hookResult.behavioralData;
      recordKeystroke = hookResult.recordKeystroke;
      recordTouch = hookResult.recordTouch;
      sendBehavioralData = hookResult.sendBehavioralData;
      getBehavioralSummary = hookResult.getBehavioralSummary;
      console.log("✅ useBehavioralData hook successful");
    } catch (error) {
      console.error("❌ Error in useBehavioralData hook:", error);
      // Provide fallback functions
      behavioralData = { keystrokes: [], touchPatterns: [] };
      recordKeystroke = () => {};
      recordTouch = () => {};
      sendBehavioralData = () => {};
      getBehavioralSummary = () => ({ keystrokeCount: 0, touchCount: 0 });
    }

    // Simplified offline balance calculations (no deposits)
    const calculateOfflineBalance = (balance) => {
      const lockedAmount = balance > 200 ? 200 : balance;
      const availableBalance = lockedAmount; // Full locked amount available

      return {
        lockedAmount,
        availableBalance,
        creditScore: 850,
        creditRatio: "1:9",
      };
    };

    // QR Code generation function
    const generateQRData = useCallback(() => {
      const qrPayload = {
        type: "TapiPay_Transfer",
        name: userProfile.name,
        securityKey: userProfile.securityKey,
        bank: userProfile.bank,
        version: "1.0",
      };
      return JSON.stringify(qrPayload);
    }, [userProfile.name, userProfile.securityKey, userProfile.bank]);

    // Copy QR data to clipboard
    const copyQRToClipboard = async () => {
      try {
        const qrString = generateQRData();
        await navigator.clipboard.writeText(qrString);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy QR data:", err);
      }
    };

    // Parse scanned QR data
    const parseQRData = (qrString) => {
      try {
        const data = JSON.parse(qrString);
        if (
          data.type === "TapiPay_Transfer" &&
          data.name &&
          data.securityKey &&
          data.bank
        ) {
          return data;
        }
        return null;
      } catch (err) {
        console.error("Failed to parse QR data:", err);
        return null;
      }
    };

    // Handle QR scan result
    const handleQRScan = (qrString) => {
      const parsedData = parseQRData(qrString);
      if (parsedData) {
        setScannedData(parsedData);
        // Auto-fill the payment form
        setPaymentFormRecipient(parsedData.name);
        setPaymentFormAccountNumber(parsedData.securityKey);
        setPaymentFormBank(parsedData.bank);
        // Mark fields as QR scanned (non-editable)
        setIsQrScanned(true);
        // Close scanner and return to transfer form
        setShowQrScanner(false);
        setCameraActive(false);
        setCurrentStep("transfer");
      }
    };

    // Demo QR scan function
    const handleDemoQRScan = () => {
      const demoQRData = generateQRData();
      handleQRScan(demoQRData);
    };

    // Calculate total tokens available (simple balance/100 calculation)
    const calculateTotalTokens = (balance) => {
      return Math.floor(balance / 100);
    };

    // Always 1 token per payment (but now from the 70% allocation)
    const calculateTokensNeeded = (paymentAmount) => {
      return 1; // Every payment uses exactly 1 token
    };

    // No security deposit needed - removed deposit logic
    const calculateSecurityDeposit = useCallback((paymentAmount) => {
      return 0; // No deposits required
    }, []);

    // Calculate total cost for offline payment (no deposits)
    const calculateTotalCost = useCallback((paymentAmount) => {
      const totalRequired = paymentAmount; // Only payment amount, no deposits

      return {
        paymentAmount,
        securityDeposit: 0, // No security deposit
        depositRequired: 0, // No deposit required
        totalRequired,
        showTotal: true, // Always show total
        creditScore: 850,
        creditRatio: "1:9",
        depositRate: 0, // No deposit rate
      };
    }, []);

    // Initialize simplified offline system (no deposits)
    const initializeOfflineSystem = () => {
      const balanceData = calculateOfflineBalance(userProfile.balance);
      setOfflineDepositSystem({
        isActive: true,
        creditScore: 850,
        creditRatio: "1:9",
        depositRate: 0, // No deposit rate
        totalDeposits: 0, // No deposits
        availableBalance: balanceData.availableBalance,
        lockedAmount: balanceData.lockedAmount,
        activatedTimestamp: Date.now(),
      });
      console.log("💳 Offline system initialized (no deposits)", balanceData);
    };

    // Clear offline system when going online
    const clearOfflineSystem = () => {
      setOfflineDepositSystem({
        isActive: false,
        creditScore: 850,
        creditRatio: "1:9",
        depositRate: 0, // No deposit rate
        totalDeposits: 0, // No deposits
        availableBalance: 0,
        lockedAmount: 0,
        activatedTimestamp: null,
      });
      console.log("🌐 Offline system cleared (no deposits)");
    };

    // Monitor online status
    useEffect(() => {
      const handleOnline = () => {
        console.log("🌐 Connection restored - no deposits to return");

        setIsOnline(true);
        setOfflineMode(false);
        clearOfflineSystem();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setOfflineMode(true);
        // Only initialize offline system if not already active
        if (!offlineDepositSystem.isActive) {
          initializeOfflineSystem();
        }
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Initialize offline system if already offline and not already active
      if (!navigator.onLine && !offlineDepositSystem.isActive) {
        initializeOfflineSystem();
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }, [userProfile.balance, offlineDepositSystem.isActive]);

    // Add global event listeners for behavioral data collection
    useEffect(() => {
      const handleKeyDown = (e) => recordKeystroke(e.key, "keydown");
      const handleKeyUp = (e) => recordKeystroke(e.key, "keyup");

      const handleTouchStart = (e) => {
        const touch = e.touches[0];
        if (touch) {
          recordTouch(
            touch.clientX,
            touch.clientY,
            "touchstart",
            touch.force || 0.5
          );
        }
      };

      const handleTouchEnd = (e) => {
        const touch = e.changedTouches[0];
        if (touch) {
          recordTouch(
            touch.clientX,
            touch.clientY,
            "touchend",
            touch.force || 0.5
          );
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }, [recordKeystroke, recordTouch]);

    // Process simplified offline payment (no deposits)
    const processOfflinePayment = useCallback(
      (amount) => {
        const paymentAmount = parseFloat(amount);
        const costBreakdown = calculateTotalCost(paymentAmount);

        if (!offlineDepositSystem.isActive) {
          throw new Error("Offline system not initialized");
        }

        // Validate sufficient available balance
        if (
          costBreakdown.totalRequired > offlineDepositSystem.availableBalance
        ) {
          throw new Error(
            `Payment amount RM${costBreakdown.totalRequired.toFixed(
              2
            )} exceeds available balance of RM${offlineDepositSystem.availableBalance.toFixed(
              2
            )}`
          );
        }

        // Calculate the results before state updates
        const balanceAfter =
          offlineDepositSystem.availableBalance - costBreakdown.totalRequired;

        // Process the payment - deduct from available balance only
        setOfflineDepositSystem((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance - costBreakdown.totalRequired,
          // No deposit changes - totalDeposits remains 0
        }));

        // Update user balance (deduct payment amount only)
        setUserProfile((prev) => ({
          ...prev,
          balance: prev.balance - costBreakdown.totalRequired,
        }));

        return {
          success: true,
          transactionId: `PAY_${Date.now()}`,
          paymentAmount,
          securityDeposit: 0, // No security deposit
          depositRequired: 0, // No deposit required
          totalCost: costBreakdown.totalRequired,
          showTotal: costBreakdown.showTotal,
          remainingBalance: balanceAfter,
          totalDeposits: 0, // No deposits
          creditScore: costBreakdown.creditScore,
          creditRatio: costBreakdown.creditRatio,
          depositRate: 0, // No deposit rate
        };
      },
      [offlineDepositSystem, calculateTotalCost]
    );

    // Handle successful authentication
    const handleAuthSuccess = useCallback(
      async (authResult) => {
        setAuthData(authResult);

        // Process payment if payment amount exists (with duplicate prevention)
        if (paymentAmount && !paymentProcessedRef.current) {
          try {
            paymentProcessedRef.current = true; // Mark as processed

            if (offlineMode) {
              // Process offline payment
              const result = processOfflinePayment(parseFloat(paymentAmount));
              setPaymentResult(result);
              console.log(
                "Offline payment processed during auth success:",
                result
              );
            } else {
              // Process online payment - deduct from balance
              const amount = parseFloat(paymentAmount);

              // Check if sufficient balance
              if (userProfile.balance >= amount) {
                setUserProfile((prev) => ({
                  ...prev,
                  balance: prev.balance - amount,
                }));

                // Set result for success screen
                setPaymentResult({
                  success: true,
                  transactionId: `TXN_${Date.now()}`,
                  paymentAmount: amount,
                  method: "online",
                  timestamp: new Date().toISOString(),
                  remainingBalance: userProfile.balance - amount,
                });

                console.log("Online payment processed:", {
                  amount,
                  newBalance: userProfile.balance - amount,
                });
              } else {
                throw new Error("Insufficient balance for online payment");
              }
            }
          } catch (error) {
            paymentProcessedRef.current = false; // Reset on error
            console.error("Error processing payment:", error);
            // You might want to show an error message to the user here
          }
        }

        // Send behavioral data after successful auth
        await sendBehavioralData();

        // Navigate to signature page if offline, otherwise go to success
        if (offlineMode) {
          // Clear signature for fresh signature on each payment
          setSignatureData(null);
          setSignatureComplete(false);
          setIsDrawing(false);
          setCurrentStep("signature");
        } else {
          setCurrentStep("success");
        }
      },
      [
        offlineMode,
        paymentAmount,
        processOfflinePayment,
        sendBehavioralData,
        userProfile.balance,
      ]
    );

    // Handle logout
    const handleLogout = () => {
      setAuthData(null);
      setPaymentAmount("");
      setPaymentRecipient("");
      setPaymentFormAmount("");
      setPaymentFormRecipient("");
      setPaymentFormAccountNumber("");
      setPaymentFormBank("");
      setPaymentFormReference("");
      setPaymentError("");

      // Reset payment processing state
      setPaymentResult(null);
      paymentProcessedRef.current = false;

      // Reset signature state
      setSignatureData(null);
      setIsDrawing(false);
      setSignatureComplete(false);

      clearOfflineSystem();
      setCurrentStep("welcome");
    };

    // Signature page functions (offline only)
    const handleSignatureStart = () => {
      setIsDrawing(true);
      setSignatureComplete(false);
    };

    const handleSignatureEnd = () => {
      setIsDrawing(false);
    };

    const handleSignatureDraw = (event) => {
      if (!isDrawing) return;

      // Simple signature tracking - in a real app, you'd capture actual drawing data
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setSignatureData((prev) => {
        const newData = prev || [];
        return [...newData, { x, y, timestamp: Date.now() }];
      });
    };

    const clearSignature = () => {
      setSignatureData(null);
      setSignatureComplete(false);
    };

    const completeSignature = () => {
      if (signatureData && signatureData.length > 10) {
        // Minimum signature requirement
        setSignatureComplete(true);
        setCurrentStep("success");
      }
    };

    // Enhanced validation for simplified offline payments (no deposits)
    const validateOfflinePayment = useCallback(
      (amount) => {
        const paymentAmount = parseFloat(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
          return { valid: false, error: "Please enter a valid payment amount" };
        }

        if (!offlineMode) {
          return { valid: true };
        }

        if (!offlineDepositSystem.isActive) {
          return { valid: false, error: "Offline system not available" };
        }

        const costBreakdown = calculateTotalCost(paymentAmount);

        // Check if sufficient balance is available (no deposits)
        if (
          costBreakdown.totalRequired > offlineDepositSystem.availableBalance
        ) {
          return {
            valid: false,
            error: `Payment amount RM${costBreakdown.totalRequired.toFixed(
              2
            )} exceeds available balance of RM${offlineDepositSystem.availableBalance.toFixed(
              2
            )}`,
          };
        }

        return {
          valid: true,
          costBreakdown,
          availableBalance: offlineDepositSystem.availableBalance,
        };
      },
      [offlineMode, offlineDepositSystem, calculateTotalCost]
    );

    // Enhanced Offline Status Indicator Component with Credit System
    const OfflineIndicator = () => {
      if (isOnline && !offlineMode) return null;

      return (
        <div className="absolute top-2 right-2 z-50">
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-400/30">
            <div className="flex items-center text-blue-200 text-xs">
              <WifiOff className="w-3 h-3 mr-1" />
              <span>Offline Mode Active</span>
            </div>
          </div>
        </div>
      );
    };

    // Render welcome screen
    const renderWelcome = () => (
      <div className="w-full h-full relative bg-gradient-to-br from-blue-600 via-blue-700 to-green-600">
        <OfflineIndicator />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-green-400/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-400/10 rounded-full animate-ping delay-500"></div>
        </div>

        <div className="relative z-10 p-6 h-full flex flex-col text-white">
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
                Experience authentication with AI-powered behavioral analysis
                and facial recognition. Multiple layers, infinite protection.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full mb-8 px-2">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-yellow-300 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Lightning Fast</div>
                    <div className="text-blue-200 text-xs">
                      Instant payment processing
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-green-300 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">
                      Face Recognition
                    </div>
                    <div className="text-blue-200 text-xs">
                      Secure login with your face
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-300 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Smart Security</div>
                    <div className="text-blue-200 text-xs">
                      Learns how you type and tap
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-blue-300 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Ultra Secure</div>
                    <div className="text-blue-200 text-xs">
                      Protected against future threats
                    </div>
                  </div>
                </div>
              </div>
              {!isOnline && (
                <div className="bg-blue-500/15 backdrop-blur-sm rounded-xl p-3 border border-blue-400/20">
                  <div className="flex items-center">
                    <WifiOff className="w-5 h-5 text-blue-300 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold text-sm">Works Offline</div>
                      <div className="text-blue-200 text-xs">
                        No internet? No problem!
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
                // Clear payment form when starting new transfer
                setPaymentFormAmount("");
                setPaymentFormRecipient("");
                setPaymentFormAccountNumber("");
                setPaymentFormBank("");
                setPaymentFormReference("");
                setPaymentError("");
                setIsProcessingPayment(false);

                // Clear signature data for fresh signature
                setSignatureData(null);
                setSignatureComplete(false);
                setIsDrawing(false);

                // Reset QR scanned state for new transfer
                setIsQrScanned(false);
                setScannedData(null);

                setCurrentStep("transfer");
              }}
              className="w-full group relative bg-white text-black py-4 rounded-2xl text-lg font-bold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl border-2 border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center justify-center">
                <CreditCard className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                Make Transfer
                <Shield className="w-4 h-4 ml-3 group-hover:animate-spin" />
              </div>
            </button>

            <button
              onClick={() => setCurrentStep("settings")}
              className="w-full group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl text-lg font-bold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl border-2 border-purple-400/30"
            >
              <div className="flex items-center justify-center">
                <QrCode className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                My QR & Settings
                <Settings className="w-4 h-4 ml-3 group-hover:animate-spin" />
              </div>
            </button>

            <div className="flex items-center justify-center">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-green-200 text-xs">
                    Online • Integrated with DuitNow & PayNet
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-blue-400 mr-2" />
                  <span className="text-blue-200 text-xs">
                    Offline Mode • Secure Local Authentication
                  </span>
                </>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-3 border border-green-400/30">
              <div className="flex items-center justify-center text-white text-xs">
                <BarChart3 className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="font-medium">
                  Collecting: {getBehavioralSummary().keystrokeCount}{" "}
                  keystrokes, {getBehavioralSummary().touchCount} touches
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // Handle payment form submission
    const handlePaymentSubmission = async () => {
      setPaymentError("");
      setIsProcessingPayment(true);

      try {
        // Validate required fields
        if (!paymentFormRecipient.trim()) {
          setPaymentError("Please enter recipient name");
          setIsProcessingPayment(false);
          return;
        }

        if (!paymentFormAccountNumber.trim()) {
          setPaymentError("Please enter security key");
          setIsProcessingPayment(false);
          return;
        }

        if (!paymentFormBank) {
          setPaymentError("Please select an e-wallet");
          setIsProcessingPayment(false);
          return;
        }

        const validation = validateOfflinePayment(paymentFormAmount);
        if (!validation.valid) {
          setPaymentError(validation.error);
          setIsProcessingPayment(false);
          return;
        }

        // Note: Actual payment processing will happen after authentication
        if (offlineMode) {
          console.log("Payment will be processed after authentication");
        }

        // Store payment details for success screen
        setPaymentAmount(paymentFormAmount);
        setPaymentRecipient(paymentFormRecipient);

        // Proceed to authentication
        setCurrentStep("auth");
      } catch (err) {
        setPaymentError(err.message);
      } finally {
        setIsProcessingPayment(false);
      }
    };

    // Render e-wallet transaction interface
    const renderBankTransactionInterface = () => {
      return (
        <div className="w-full h-full relative bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
          <OfflineIndicator />

          {/* Background animations */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 animate-bounce delay-100">
              <CreditCard className="w-4 h-4 text-blue-300" />
            </div>
            <div className="absolute top-32 right-16 animate-bounce delay-300">
              <Shield className="w-3 h-3 text-green-300" />
            </div>
            <div className="absolute bottom-40 left-20 animate-bounce delay-500">
              <BarChart3 className="w-3 h-3 text-yellow-300" />
            </div>
          </div>

          <div className="flex flex-col h-full p-6 relative z-10">
            <div className="h-6"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-white mr-2" />
                <h2 className="text-lg font-bold text-white"> Transfer</h2>
              </div>
              <button
                onClick={() => setCurrentStep("welcome")}
                className="flex items-center text-white/70 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm">Back</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto pb-6">
              {/* Account Balance Card */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                <div className="text-center">
                  <div className="text-white text-lg font-semibold mb-1">
                    {userProfile.name}
                  </div>
                  <div className="text-white/70 text-sm mb-1">
                    Available Balance
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    RM{userProfile.balance.toFixed(2)}
                  </div>
                  <div className="text-white/60 text-xs">
                    {userProfile.accountNumber}
                  </div>
                </div>
              </div>

              {/* Bank Transfer Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Recipient Name{" "}
                    {isQrScanned && (
                      <span className="text-green-400 text-xs">
                        (QR Scanned)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={paymentFormRecipient}
                    onChange={(e) => setPaymentFormRecipient(e.target.value)}
                    disabled={isQrScanned}
                    className={`w-full backdrop-blur-sm border rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none transition-colors ${
                      isQrScanned
                        ? "bg-green-500/20 border-green-400/50 cursor-not-allowed"
                        : "bg-white/10 border-white/20 focus:border-blue-400"
                    }`}
                    placeholder="Enter recipient name"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Security Key{" "}
                    {isQrScanned && (
                      <span className="text-green-400 text-xs">
                        (QR Scanned)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={paymentFormAccountNumber}
                    onChange={(e) =>
                      setPaymentFormAccountNumber(e.target.value)
                    }
                    disabled={isQrScanned}
                    className={`w-full backdrop-blur-sm border rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none transition-colors ${
                      isQrScanned
                        ? "bg-green-500/20 border-green-400/50 cursor-not-allowed"
                        : "bg-white/10 border-white/20 focus:border-blue-400"
                    }`}
                    placeholder="abc1234"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    E-Wallet{" "}
                    {isQrScanned && (
                      <span className="text-green-400 text-xs">
                        (QR Scanned)
                      </span>
                    )}
                  </label>
                  <select
                    value={paymentFormBank}
                    onChange={(e) => setPaymentFormBank(e.target.value)}
                    disabled={isQrScanned}
                    className={`w-full backdrop-blur-sm border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${
                      isQrScanned
                        ? "bg-green-500/20 border-green-400/50 cursor-not-allowed"
                        : "bg-white/10 border-white/20 focus:border-blue-400"
                    }`}
                  >
                    <option value="" className="bg-gray-800">
                      Select E-Wallet
                    </option>
                    <option value="grabpay" className="bg-gray-800">
                      GrabPay
                    </option>
                    <option value="touchngo" className="bg-gray-800">
                      Touch 'n Go eWallet
                    </option>
                    <option value="boost" className="bg-gray-800">
                      Boost
                    </option>
                    <option value="shopeepay" className="bg-gray-800">
                      ShopeePay
                    </option>
                    <option value="bigpay" className="bg-gray-800">
                      BigPay
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Transfer Amount (RM)
                  </label>
                  <input
                    type="number"
                    value={paymentFormAmount}
                    onChange={(e) => {
                      setPaymentFormAmount(e.target.value);
                      setPaymentError("");
                    }}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors text-lg font-semibold"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max={
                      offlineMode
                        ? offlineDepositSystem.availableBalance
                        : userProfile.balance
                    }
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentFormReference}
                    onChange={(e) => setPaymentFormReference(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Payment reference or note"
                  />
                </div>

                {paymentError && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                    <div className="text-red-300 text-sm font-medium">
                      {paymentError}
                    </div>
                  </div>
                )}
              </div>

              {/* Simplified Smart Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[10, 25, 50, 150].map((amount) => {
                  let isDisabled = false;
                  let costBreakdown = null;
                  let validationResult = null;

                  if (offlineMode && offlineDepositSystem.isActive) {
                    validationResult = validateOfflinePayment(amount);
                    costBreakdown = calculateTotalCost(amount);
                    isDisabled = !validationResult.valid;
                  }

                  return (
                    <button
                      key={amount}
                      onClick={() => {
                        if (!isDisabled) {
                          setPaymentFormAmount(amount.toString());
                          setPaymentError("");
                        }
                      }}
                      disabled={isDisabled}
                      className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isDisabled
                          ? "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                          : "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                      } backdrop-blur-sm border border-white/20`}
                    >
                      <div className="font-bold">RM{amount}</div>
                    </button>
                  );
                })}
              </div>

              {/* Simplified Transfer Summary */}
              {paymentFormAmount && parseFloat(paymentFormAmount) > 0 && (
                <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30 mb-6">
                  <div className="text-blue-200 text-sm mb-3">
                    Transfer Summary
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-white">
                      <span>Payment Amount:</span>
                      <span className="font-bold">
                        RM{parseFloat(paymentFormAmount).toFixed(2)}
                      </span>
                    </div>

                    {offlineMode &&
                      offlineDepositSystem.isActive &&
                      (() => {
                        const costBreakdown = calculateTotalCost(
                          parseFloat(paymentFormAmount)
                        );
                        const paymentAmount = parseFloat(paymentFormAmount);

                        return (
                          <>
                            <div className="border-t border-blue-400/30 mt-3 pt-2 flex justify-between items-center text-white font-bold">
                              <span>Payment Amount:</span>
                              <span>
                                RM{costBreakdown.totalRequired.toFixed(2)}
                              </span>
                            </div>
                          </>
                        );
                      })()}

                    {!offlineMode && (
                      <>
                        <div className="flex justify-between items-center text-white/70 text-sm">
                          <span>Transfer Fee:</span>
                          <span>RM0.00</span>
                        </div>
                        <div className="border-t border-blue-400/30 mt-2 pt-2 flex justify-between items-center text-white font-bold">
                          <span>Total:</span>
                          <span>
                            RM{parseFloat(paymentFormAmount).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* QR Action Buttons */}
              {!isQrScanned ? (
                <button
                  onClick={() => {
                    setShowQrScanner(true);
                    setCurrentStep("qr-scanner");
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl text-base font-semibold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg mb-3"
                >
                  <div className="flex items-center justify-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Scan QR
                    <QrCode className="w-4 h-4 ml-2" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsQrScanned(false);
                    setPaymentFormRecipient("");
                    setPaymentFormAccountNumber("");
                    setPaymentFormBank("");
                    setScannedData(null);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl text-base font-semibold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg mb-3"
                >
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear QR Data
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                </button>
              )}

              {/* Proceed Button */}
              <button
                onClick={handlePaymentSubmission}
                disabled={
                  !paymentFormRecipient ||
                  !paymentFormAccountNumber ||
                  !paymentFormBank ||
                  !paymentFormAmount ||
                  parseFloat(paymentFormAmount) <= 0 ||
                  isProcessingPayment
                }
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl text-lg font-bold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                <div className="flex items-center justify-center">
                  {isProcessingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Proceed with TapiPay
                      <Shield className="w-4 h-4 ml-3" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    };

    // Render success screen
    const renderSuccess = () => {
      // Use stored payment results or fallback to current state
      const displayResult = paymentResult || {
        remainingBalance: offlineDepositSystem.availableBalance,
        totalDeposits: offlineDepositSystem.totalDeposits,
      };

      const remainingBalance =
        displayResult.remainingBalance || offlineDepositSystem.availableBalance;
      const totalDeposits =
        displayResult.totalDeposits || offlineDepositSystem.totalDeposits;

      return (
        <div className="w-full h-full relative">
          {/* Fixed gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-blue-800 to-purple-800"></div>

          <OfflineIndicator />

          {/* Sparkle animations */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 animate-bounce delay-100">
              <Shield className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="absolute top-32 right-16 animate-bounce delay-300">
              <CreditCard className="w-3 h-3 text-blue-300" />
            </div>
            <div className="absolute bottom-40 left-20 animate-bounce delay-500">
              <BarChart3 className="w-3 h-3 text-green-300" />
            </div>
          </div>

          <div className="flex flex-col h-full p-6 relative z-10 overflow-y-auto">
            <div className="h-6"></div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="relative mb-8 text-center">
                <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 border-4 border-green-400 rounded-full animate-ping opacity-30"></div>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Transfer Successful!
                </h2>
                <p className="text-lg text-green-200 mb-8">
                  {!isOnline
                    ? "Secured by TapiPay Offline Cryptographic Authentication"
                    : "Secured by TapiPay Multi-Modal Authentication"}
                </p>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Amount</span>
                    <span className="text-xl font-bold text-white">
                      RM {paymentAmount || "25.50"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">To</span>
                    <span className="text-white text-sm">
                      {paymentRecipient || "Recipient"}
                    </span>
                  </div>

                  {!isOnline && offlineDepositSystem.isActive && (
                    <>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-white/70 text-sm">Token ID:</span>
                        <span className="text-blue-300 text-xs font-mono">
                          {`PAY_${Date.now().toString().slice(-6)}...`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30 mb-8">
                <div className="flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-yellow-300 mr-2" />
                  <span className="text-white font-medium text-sm">
                    PayNet Innovation Award Winner
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pb-6">
              <button
                onClick={() => {
                  console.log("🔄 User clicked 'Make Another Transfer'");

                  // Reset payment processing state for new transaction
                  setPaymentResult(null);
                  paymentProcessedRef.current = false;

                  // Clear signature for new payment
                  setSignatureData(null);
                  setSignatureComplete(false);
                  setIsDrawing(false);

                  // Reset QR scanned state for new transfer
                  setIsQrScanned(false);
                  setScannedData(null);

                  setCurrentStep("transfer");
                  setPaymentFormRecipient("");
                  setPaymentFormAmount("");
                  setPaymentFormAccountNumber("");
                  setPaymentFormBank("");
                  setPaymentFormReference("");
                  setPaymentError("");
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-xl text-base font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Make Another Transfer
                </div>
              </button>
              <button
                onClick={() => {
                  console.log("🏠 User clicked 'Back to Home'");
                  handleLogout();
                }}
                className="w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl text-base border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    };

    // Render Settings Screen
    const renderSettings = () => {
      const qrString = generateQRData();

      return (
        <div className="w-full h-full relative bg-gradient-to-br from-purple-600 via-blue-700 to-green-600">
          <OfflineIndicator />

          {/* Background animations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-green-400/10 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-400/10 rounded-full animate-ping delay-500"></div>
          </div>

          <div className="relative z-10 p-6 h-full flex flex-col text-white overflow-y-auto">
            <div className="h-6"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Settings className="w-6 h-6 text-white mr-2" />
                <h2 className="text-lg font-bold text-white">
                  My QR & Settings
                </h2>
              </div>
              <button
                onClick={() => setCurrentStep("welcome")}
                className="flex items-center text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-sm">Back</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              {/* User Profile Card */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-bold">
                      {userProfile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {userProfile.name}
                  </h3>
                  <div className="space-y-1 text-sm text-white/70">
                    <div>Account: {userProfile.accountNumber}</div>
                    <div>E-Wallet: {userProfile.bank.toUpperCase()}</div>
                    <div>Security Key: {userProfile.securityKey}</div>
                  </div>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
                    <QrCode className="w-5 h-5 mr-2" />
                    Your Payment QR Code
                  </h4>

                  {/* QR Code Visual Representation */}
                  <div
                    className="bg-white rounded-xl p-4 mb-4 mx-auto"
                    style={{ width: "fit-content" }}
                  >
                    <QRCodeSVG
                      value={qrString}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>

                  <div className="text-xs text-white/60 mb-4 font-mono break-all px-2">
                    {qrString}
                  </div>

                  <button
                    onClick={copyQRToClipboard}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy QR Data
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
                <h5 className="text-sm font-semibold text-blue-200 mb-2">
                  How to Share Your QR:
                </h5>
                <div className="text-xs text-blue-100 space-y-1">
                  <div>• Tap "Copy QR Data" to copy your payment details</div>
                  <div>• Share the copied text with others</div>
                  <div>
                    • They can scan it using "Scan QR" in transfer screen
                  </div>
                  <div>• Your details will auto-fill in their payment form</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Render QR Scanner Screen
    const renderQRScanner = () => {
      return (
        <div className="w-full h-full relative bg-gradient-to-br from-gray-900 via-blue-900 to-black">
          <OfflineIndicator />

          <div className="relative z-10 p-6 h-full flex flex-col text-white">
            <div className="h-6"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Camera className="w-6 h-6 text-white mr-2" />
                <h2 className="text-lg font-bold text-white">Scan QR Code</h2>
              </div>
              <button
                onClick={() => {
                  setShowQrScanner(false);
                  setCameraActive(false);
                  setCurrentStep("transfer");
                }}
                className="flex items-center text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-sm">Back</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              {/* Camera Interface */}
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6 flex-1">
                <div className="relative h-full">
                  {/* Camera Preview Area */}
                  <div className="bg-gray-800 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
                    {cameraActive ? (
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-green-400 mb-2 animate-pulse" />
                        <div className="text-green-400 text-sm">
                          Camera Active
                        </div>
                        <div className="text-white/60 text-xs mt-1">
                          Point camera at QR code
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-white/40 mb-2" />
                        <div className="text-white/60 text-sm">
                          Camera Inactive
                        </div>
                        <div className="text-white/40 text-xs mt-1">
                          Tap to activate camera
                        </div>
                      </div>
                    )}

                    {/* Scanning Overlay */}
                    <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>

                      {cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => setCameraActive(!cameraActive)}
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                        cameraActive
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {cameraActive ? "Stop Camera" : "Start Camera"}
                    </button>

                    <button
                      onClick={handleDemoQRScan}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Scan QR
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
                <h5 className="text-sm font-semibold text-blue-200 mb-2">
                  How to Scan:
                </h5>
                <div className="text-xs text-blue-100 space-y-1">
                  <div>• Tap "Start Camera" to activate scanning</div>
                  <div>• Point camera at a TapiPay QR code</div>
                  <div>• QR data will auto-fill the payment form</div>
                  <div>• Use "Demo: Scan My QR" to test with your own QR</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Render Signature Page (offline only)
    const renderSignaturePage = () => {
      return (
        <div className="w-full h-full relative">
          {/* Fixed gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600"></div>

          <OfflineIndicator />

          <div className="relative z-10 p-6 h-full flex flex-col text-white overflow-y-auto">
            <div className="h-6"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-white mr-2" />
                <h2 className="text-lg font-bold text-white">
                  Digital Signature Required
                </h2>
              </div>
            </div>

            {/* Signature Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Please provide your signature
              </h3>
              <p className="text-white/80 text-sm mb-4">
                For offline payments, we require a digital signature to complete
                the transaction securely.
              </p>

              {/* Payment Summary */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Payment Amount:</span>
                  <span className="text-white font-semibold">
                    RM {paymentAmount}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70 text-sm">Recipient:</span>
                  <span className="text-white font-semibold">
                    {paymentFormRecipient || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Authentication:</span>
                  <span className="text-green-400 font-semibold">
                    {authData?.method || "Verified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-semibold">
                  Draw your signature below:
                </h4>
                <button
                  onClick={clearSignature}
                  className="text-white/70 hover:text-white text-sm underline transition-colors"
                >
                  Clear
                </button>
              </div>

              {/* Signature Drawing Area */}
              <div
                className="bg-white rounded-xl h-32 border-2 border-dashed border-gray-300 cursor-crosshair relative overflow-hidden"
                onMouseDown={handleSignatureStart}
                onMouseUp={handleSignatureEnd}
                onMouseMove={handleSignatureDraw}
                onTouchStart={handleSignatureStart}
                onTouchEnd={handleSignatureEnd}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = {
                    target: e.target,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  };
                  handleSignatureDraw(mouseEvent);
                }}
              >
                {!signatureData || signatureData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                    Click and drag to sign
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    {/* Simple signature visualization */}
                    <svg className="w-full h-full">
                      {signatureData.map((point, index) => {
                        if (index === 0) return null;
                        const prevPoint = signatureData[index - 1];
                        return (
                          <line
                            key={index}
                            x1={prevPoint.x}
                            y1={prevPoint.y}
                            x2={point.x}
                            y2={point.y}
                            stroke="#1f2937"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>
                  </div>
                )}
              </div>

              {/* Signature Status */}
              <div className="mt-4 text-center">
                {signatureData && signatureData.length > 10 ? (
                  <div className="text-green-400 text-sm flex items-center justify-center">
                    <Check className="w-4 h-4 mr-1" />
                    Signature captured
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">
                    Please draw your signature above
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={clearSignature}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-white/20"
              >
                Clear Signature
              </button>
              <button
                onClick={completeSignature}
                disabled={!signatureData || signatureData.length <= 10}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  signatureData && signatureData.length > 10
                    ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg"
                    : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                }`}
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      );
    };

    // Main render logic
    console.log("🔍 TapiPay Render Debug:", {
      currentStep,
      isOnline,
      offlineMode,
      userProfile,
      offlineDepositSystem,
    });

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="relative">
          <div
            className="bg-black rounded-[3.5rem] p-2 shadow-2xl"
            style={{ width: "375px", height: "812px" }}
          >
            <div className="rounded-[3rem] h-full overflow-hidden relative">
              {currentStep === "welcome" && renderWelcome()}
              {currentStep === "settings" && renderSettings()}
              {currentStep === "qr-scanner" && renderQRScanner()}
              {currentStep === "transfer" && renderBankTransactionInterface()}
              {currentStep === "auth" && (
                <AuthenticationFlow
                  onSuccess={handleAuthSuccess}
                  onBack={() => setCurrentStep("transfer")}
                  isOffline={!isOnline}
                  skipDemo={true}
                />
              )}
              {currentStep === "signature" && renderSignaturePage()}
              {currentStep === "success" && renderSuccess()}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Critical error in TapiPay component:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-red-600 text-xl font-bold mb-4">
            Error Loading TapiPay
          </h2>
          <p className="text-gray-700 mb-4">
            There was an error loading the application:
          </p>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }
};

export default TapiPayMobileMVP;
