import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Offline system state structure
const initialOfflineState = {
  isOnline: navigator.onLine,
  offlineMode: false,
  depositSystem: {
    isActive: false,
    creditScore: 850,
    creditRatio: "1:9",
    depositRate: 0,
    totalDeposits: 0,
    availableBalance: 0,
    lockedAmount: 0,
    activatedTimestamp: null,
  }
};

// Offline actions
const OFFLINE_ACTIONS = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_OFFLINE_MODE: 'SET_OFFLINE_MODE',
  INITIALIZE_DEPOSIT_SYSTEM: 'INITIALIZE_DEPOSIT_SYSTEM',
  CLEAR_DEPOSIT_SYSTEM: 'CLEAR_DEPOSIT_SYSTEM',
  UPDATE_DEPOSIT_SYSTEM: 'UPDATE_DEPOSIT_SYSTEM',
  PROCESS_OFFLINE_PAYMENT: 'PROCESS_OFFLINE_PAYMENT'
};

// Offline reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case OFFLINE_ACTIONS.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    
    case OFFLINE_ACTIONS.SET_OFFLINE_MODE:
      return { ...state, offlineMode: action.payload };
    
    case OFFLINE_ACTIONS.INITIALIZE_DEPOSIT_SYSTEM:
      const { userBalance } = action.payload;
      const lockedAmount = userBalance > 200 ? 200 : userBalance;
      return {
        ...state,
        depositSystem: {
          ...state.depositSystem,
          isActive: true,
          availableBalance: lockedAmount,
          lockedAmount: lockedAmount,
          activatedTimestamp: Date.now()
        }
      };
    
    case OFFLINE_ACTIONS.CLEAR_DEPOSIT_SYSTEM:
      return {
        ...state,
        depositSystem: {
          ...initialOfflineState.depositSystem,
          isActive: false
        }
      };
    
    case OFFLINE_ACTIONS.UPDATE_DEPOSIT_SYSTEM:
      return {
        ...state,
        depositSystem: {
          ...state.depositSystem,
          ...action.payload
        }
      };
    
    case OFFLINE_ACTIONS.PROCESS_OFFLINE_PAYMENT:
      const { paymentAmount } = action.payload;
      const newAvailableBalance = state.depositSystem.availableBalance - paymentAmount;
      return {
        ...state,
        depositSystem: {
          ...state.depositSystem,
          availableBalance: Math.max(0, newAvailableBalance)
        }
      };
    
    default:
      return state;
  }
};

// Create context
const OfflineContext = createContext();

// Offline provider component
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialOfflineState);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Online');
      dispatch({ type: OFFLINE_ACTIONS.SET_ONLINE_STATUS, payload: true });
    };

    const handleOffline = () => {
      console.log('📴 Network: Offline');
      dispatch({ type: OFFLINE_ACTIONS.SET_ONLINE_STATUS, payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-clear deposit system when going online
  useEffect(() => {
    if (state.isOnline && !state.offlineMode && state.depositSystem.isActive) {
      console.log('💰 Returning deposits due to network online');
      clearDepositSystem();
    }
  }, [state.isOnline, state.offlineMode, state.depositSystem.isActive]);

  // Action creators
  const setOfflineMode = useCallback((mode) => {
    dispatch({ type: OFFLINE_ACTIONS.SET_OFFLINE_MODE, payload: mode });
  }, []);

  const initializeDepositSystem = useCallback((userBalance) => {
    if (!state.depositSystem.isActive) {
      console.log('🏦 Initializing deposit system with balance:', userBalance);
      dispatch({ 
        type: OFFLINE_ACTIONS.INITIALIZE_DEPOSIT_SYSTEM, 
        payload: { userBalance } 
      });
    }
  }, [state.depositSystem.isActive]);

  const clearDepositSystem = useCallback(() => {
    console.log('🧹 Clearing deposit system');
    dispatch({ type: OFFLINE_ACTIONS.CLEAR_DEPOSIT_SYSTEM });
  }, []);

  const updateDepositSystem = useCallback((updates) => {
    dispatch({ 
      type: OFFLINE_ACTIONS.UPDATE_DEPOSIT_SYSTEM, 
      payload: updates 
    });
  }, []);

  const processOfflinePayment = useCallback((paymentAmount) => {
    console.log('💳 Processing offline payment:', paymentAmount);
    dispatch({ 
      type: OFFLINE_ACTIONS.PROCESS_OFFLINE_PAYMENT, 
      payload: { paymentAmount } 
    });
  }, []);

  // Utility functions
  const calculateOfflineBalance = useCallback(() => {
    return state.depositSystem.availableBalance;
  }, [state.depositSystem.availableBalance]);

  const validateOfflinePayment = useCallback((amount) => {
    const availableBalance = calculateOfflineBalance();
    if (amount > availableBalance) {
      return {
        valid: false,
        error: `Insufficient offline balance. Available: RM${availableBalance.toFixed(2)}`
      };
    }
    return { valid: true };
  }, [calculateOfflineBalance]);

  const value = {
    // State
    ...state,
    
    // Actions
    setOfflineMode,
    initializeDepositSystem,
    clearDepositSystem,
    updateDepositSystem,
    processOfflinePayment,
    
    // Utilities
    calculateOfflineBalance,
    validateOfflinePayment
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Custom hook to use offline context
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;
