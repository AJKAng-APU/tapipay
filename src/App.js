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
      bank: "maybank",
      securityKey: "ABCD123",
    });

    // Credit-based deposit system state
    const [offlineDepositSystem, setOfflineDepositSystem] = useState({
      isActive: false,
      creditScore: 850,
      creditRatio: "1:9", // 1 part deposit : 9 parts credit
      depositRate: 10.0, // 10% deposit rate
      totalDeposits: 0,
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

    // Credit-based deposit calculations
    const calculateCreditDeposit = (balance) => {
      const lockedAmount = balance > 200 ? 200 : balance;
      const depositRate = 10.0; // 10% deposit rate
      const totalDeposits = lockedAmount * (depositRate / 100);
      const availableBalance = lockedAmount - totalDeposits;
      
      return {
        lockedAmount,
        depositRate,
        totalDeposits,
        availableBalance,
        creditScore: 850,
        creditRatio: "1:9"
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

    // Security deposit calculation (50% of transfer amount for ≥RM100)
    // Calculate 10% deposit for all payments
    const calculateSecurityDeposit = useCallback((paymentAmount) => {
      return paymentAmount * 0.1; // 10% deposit for all payments
    }, []);

    // Calculate total cost for offline payment (simplified to 10% deposit only)
    const calculateTotalCost = useCallback(
      (paymentAmount) => {
        const depositRequired = paymentAmount * 0.1; // 10% deposit for all offline payments
        const totalRequired = paymentAmount + depositRequired;

        return {
          paymentAmount,
          securityDeposit: 0, // No security deposit
          depositRequired,
          totalRequired,
          showTotal: true, // Always show total
          creditScore: 850,
          creditRatio: "1:9",
          depositRate: 10.0
        };
      },
      []
    );

    // Initialize credit-based deposit system
    const initializeDepositSystem = () => {
      const creditData = calculateCreditDeposit(userProfile.balance);
      setOfflineDepositSystem({
        isActive: true,
        creditScore: creditData.creditScore,
        creditRatio: creditData.creditRatio,
        depositRate: creditData.depositRate,
        totalDeposits: creditData.totalDeposits,
        availableBalance: creditData.availableBalance,
        lockedAmount: creditData.lockedAmount,
        activatedTimestamp: new Date().toISOString(),
      });
    };

    // Clear deposit system when going online
    const clearDepositSystem = () => {
      setOfflineDepositSystem({
        isActive: false,
        creditScore: 850,
        creditRatio: "1:9",
        depositRate: 10.0,
        totalDeposits: 0,
        availableBalance: 0,
        lockedAmount: 0,
        activatedTimestamp: null,
      });
    };

    // Monitor online status
    useEffect(() => {
      const handleOnline = () => {
        console.log("🌐 Connection restored - returning deposits");

        // Return deposits to user balance before clearing deposit system
        if (offlineDepositSystem.totalDeposits > 0) {
          const depositsToReturn = offlineDepositSystem.totalDeposits;

          setUserProfile((prev) => ({
            ...prev,
            balance: prev.balance + depositsToReturn,
          }));

          console.log(
            `💰 Returned RM${depositsToReturn.toFixed(2)} deposits`
          );
        }

        setIsOnline(true);
        setOfflineMode(false);
        clearDepositSystem();
      };
      const handleOffline = () => {
        setIsOnline(false);
        setOfflineMode(true);
        // Only initialize deposit system if not already active
        if (!offlineDepositSystem.isActive) {
          initializeDepositSystem();
        }
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Initialize deposit system if already offline and not already active
      if (!navigator.onLine && !offlineDepositSystem.isActive) {
        initializeDepositSystem();
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }, [
      userProfile.balance,
      offlineDepositSystem.isActive,
      offlineDepositSystem.totalDeposits,
    ]);

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

    // Process credit-based offline payment with deposits
    const processOfflinePayment = useCallback(
      (amount) => {
        const paymentAmount = parseFloat(amount);
        const costBreakdown = calculateTotalCost(paymentAmount);

        if (!offlineDepositSystem.isActive) {
          throw new Error("Deposit system not initialized");
        }

        // Validate sufficient available balance
        if (costBreakdown.totalRequired > offlineDepositSystem.availableBalance) {
          throw new Error(
            `Total required RM${costBreakdown.totalRequired.toFixed(
              2
            )} exceeds available balance of RM${offlineDepositSystem.availableBalance.toFixed(
              2
            )}`
          );
        }

        // Calculate the results before state updates
        const balanceAfter = offlineDepositSystem.availableBalance - costBreakdown.totalRequired;
        const depositsAfter = offlineDepositSystem.totalDeposits + costBreakdown.depositRequired;

        // Process the payment - deduct from available balance and add to deposits
        setOfflineDepositSystem((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance - costBreakdown.totalRequired,
          totalDeposits: prev.totalDeposits + costBreakdown.depositRequired,
        }));

        // Update user balance (deduct total required amount)
        setUserProfile((prev) => ({
          ...prev,
          balance: prev.balance - costBreakdown.totalRequired,
        }));

        return {
          success: true,
          transactionId: `DEP_${Date.now()}`,
          paymentAmount,
          securityDeposit: costBreakdown.securityDeposit,
          depositRequired: costBreakdown.depositRequired,
          totalCost: costBreakdown.totalRequired,
          showTotal: costBreakdown.showTotal,
          remainingBalance: balanceAfter,
          totalDeposits: depositsAfter,
          creditScore: costBreakdown.creditScore,
          creditRatio: costBreakdown.creditRatio,
          depositRate: costBreakdown.depositRate,
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
                  method: 'online',
                  timestamp: new Date().toISOString(),
                  remainingBalance: userProfile.balance - amount
                });
                
                console.log("Online payment processed:", {
                  amount,
                  newBalance: userProfile.balance - amount
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

        setCurrentStep("success");
      },
      [offlineMode, paymentAmount, processOfflinePayment, sendBehavioralData, userProfile.balance]
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

      clearDepositSystem();
      setCurrentStep("welcome");
    };

    // Enhanced validation for credit-based offline payments with deposits
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
          return { valid: false, error: "Deposit system not available" };
        }

        const costBreakdown = calculateTotalCost(paymentAmount);

        // Check if sufficient balance is available
        if (costBreakdown.totalRequired > offlineDepositSystem.availableBalance) {
          return {
            valid: false,
            error: `Total required RM${costBreakdown.totalRequired.toFixed(
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
                Experience quantum-ready authentication with AI-powered
                behavioral analysis and facial recognition. Multiple layers,
                infinite protection.
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
                // Reset payment processing state for new transaction
                setPaymentResult(null);
                paymentProcessedRef.current = false;
                setCurrentStep("transfer");
              }}
              className="w-full group relative bg-white text-black py-4 rounded-2xl text-lg font-bold transform transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl border-2 border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-center justify-center">
                <CreditCard className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                Make Bank Transfer
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
          setPaymentError("Please select a bank");
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

    // Render bank transaction interface
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
                <h2 className="text-lg font-bold text-white">Bank Transfer</h2>
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
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={paymentFormRecipient}
                    onChange={(e) => setPaymentFormRecipient(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="Enter recipient name"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Security Key
                  </label>
                  <input
                    type="text"
                    value={paymentFormAccountNumber}
                    onChange={(e) =>
                      setPaymentFormAccountNumber(e.target.value)
                    }
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 transition-colors"
                    placeholder="abc1234"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Bank
                  </label>
                  <select
                    value={paymentFormBank}
                    onChange={(e) => setPaymentFormBank(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
                  >
                    <option value="" className="bg-gray-800">
                      Select Bank
                    </option>
                    <option value="maybank" className="bg-gray-800">
                      Maybank
                    </option>
                    <option value="cimb" className="bg-gray-800">
                      CIMB Bank
                    </option>
                    <option value="public" className="bg-gray-800">
                      Public Bank
                    </option>
                    <option value="rhb" className="bg-gray-800">
                      RHB Bank
                    </option>
                    <option value="hong-leong" className="bg-gray-800">
                      Hong Leong Bank
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
                      {offlineMode && offlineDepositSystem.isActive && (
                        <div className="text-xs opacity-75 mt-1">
                          <div className="text-blue-300">10% deposit</div>
                        </div>
                      )}
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
                            <div className="flex justify-between items-center text-blue-300 text-sm">
                              <span>Deposit Required (10%):</span>
                              <span>
                                RM{costBreakdown.depositRequired.toFixed(2)}
                              </span>
                            </div>
                            <div className="border-t border-blue-400/30 mt-3 pt-2 flex justify-between items-center text-white font-bold">
                              <span>Total Required:</span>
                              <span>
                                RM{costBreakdown.totalRequired.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-blue-200 mt-2 opacity-75">
                              * Deposits will be returned when going back online
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

              {/* Scan QR Button */}
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

      const remainingBalance = displayResult.remainingBalance || offlineDepositSystem.availableBalance;
      const totalDeposits = displayResult.totalDeposits || offlineDepositSystem.totalDeposits;

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
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Security</span>
                    <span className="text-green-300 flex items-center text-sm text-right">
                      <Shield className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {!isOnline
                          ? authData?.method === "Face Recognition"
                            ? "Offline Face + Behavioral + Crypto"
                            : "Offline Behavioral + Crypto"
                          : authData?.method === "Face Recognition"
                          ? "Face + Behavioral + Quantum"
                          : "Behavioral + Quantum"}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">
                      Behavioral Score
                    </span>
                    <span className="text-blue-300 text-sm">
                      {getBehavioralSummary().keystrokeCount +
                        getBehavioralSummary().touchCount >
                      10
                        ? "High"
                        : "Medium"}{" "}
                      Confidence
                    </span>
                  </div>
                  {!isOnline && offlineDepositSystem.isActive && (
                    <>
                      <div className="border-t border-white/20 pt-3 mt-3">
                        <div className="text-blue-300 text-sm font-medium mb-2">
                          Payment Summary
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-sm">
                              Available Balance:
                            </span>
                            <span className="text-blue-300 text-sm font-bold">
                              RM{offlineDepositSystem.availableBalance.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/70 text-sm">
                              Total Deposits:
                            </span>
                            <span className="text-yellow-300 text-sm font-bold">
                              RM{offlineDepositSystem.totalDeposits.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-white/20 pt-2 mt-2">
                            {(() => {
                              const amount = parseFloat(paymentAmount || 0);
                              const depositRequired = amount * 0.1;
                              return (
                                <>
                                  <div className="text-green-300 text-xs">
                                    ✨ Deposit required (10%): RM{depositRequired.toFixed(2)}
                                  </div>
                                  <div className="text-yellow-300 text-xs">
                                    💰 Deposits will be returned when going back online
                                  </div>
                                </>
                              );
                            })()} 
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-white/70 text-sm">
                          Transaction ID:
                        </span>
                        <span className="text-blue-300 text-xs font-mono">
                          {`DEP_${Date.now().toString().slice(-6)}...`}
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
                    <div>Bank: {userProfile.bank.toUpperCase()}</div>
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
