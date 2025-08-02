import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Payment state structure
const initialPaymentState = {
  amount: '',
  recipient: '',
  accountNumber: '',
  bank: '',
  reference: '',
  error: '',
  isProcessing: false,
  result: null,
  formData: {
    amount: '',
    recipient: '',
    accountNumber: '',
    bank: '',
    reference: ''
  }
};

// Payment actions
const PAYMENT_ACTIONS = {
  SET_AMOUNT: 'SET_AMOUNT',
  SET_RECIPIENT: 'SET_RECIPIENT',
  SET_ACCOUNT_NUMBER: 'SET_ACCOUNT_NUMBER',
  SET_BANK: 'SET_BANK',
  SET_REFERENCE: 'SET_REFERENCE',
  SET_ERROR: 'SET_ERROR',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_RESULT: 'SET_RESULT',
  UPDATE_FORM_DATA: 'UPDATE_FORM_DATA',
  RESET_PAYMENT: 'RESET_PAYMENT',
  RESET_FORM: 'RESET_FORM'
};

// Payment reducer
const paymentReducer = (state, action) => {
  switch (action.type) {
    case PAYMENT_ACTIONS.SET_AMOUNT:
      return { ...state, amount: action.payload };
    case PAYMENT_ACTIONS.SET_RECIPIENT:
      return { ...state, recipient: action.payload };
    case PAYMENT_ACTIONS.SET_ACCOUNT_NUMBER:
      return { ...state, accountNumber: action.payload };
    case PAYMENT_ACTIONS.SET_BANK:
      return { ...state, bank: action.payload };
    case PAYMENT_ACTIONS.SET_REFERENCE:
      return { ...state, reference: action.payload };
    case PAYMENT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case PAYMENT_ACTIONS.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };
    case PAYMENT_ACTIONS.SET_RESULT:
      return { ...state, result: action.payload };
    case PAYMENT_ACTIONS.UPDATE_FORM_DATA:
      return { 
        ...state, 
        formData: { ...state.formData, ...action.payload } 
      };
    case PAYMENT_ACTIONS.RESET_PAYMENT:
      return { 
        ...initialPaymentState,
        formData: state.formData // Keep form data
      };
    case PAYMENT_ACTIONS.RESET_FORM:
      return { 
        ...state,
        formData: initialPaymentState.formData
      };
    default:
      return state;
  }
};

// Create context
const PaymentContext = createContext();

// Payment provider component
export const PaymentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialPaymentState);

  // Action creators
  const setAmount = useCallback((amount) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_AMOUNT, payload: amount });
  }, []);

  const setRecipient = useCallback((recipient) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_RECIPIENT, payload: recipient });
  }, []);

  const setAccountNumber = useCallback((accountNumber) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_ACCOUNT_NUMBER, payload: accountNumber });
  }, []);

  const setBank = useCallback((bank) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_BANK, payload: bank });
  }, []);

  const setReference = useCallback((reference) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_REFERENCE, payload: reference });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const setProcessing = useCallback((isProcessing) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: isProcessing });
  }, []);

  const setResult = useCallback((result) => {
    dispatch({ type: PAYMENT_ACTIONS.SET_RESULT, payload: result });
  }, []);

  const updateFormData = useCallback((data) => {
    dispatch({ type: PAYMENT_ACTIONS.UPDATE_FORM_DATA, payload: data });
  }, []);

  const resetPayment = useCallback(() => {
    dispatch({ type: PAYMENT_ACTIONS.RESET_PAYMENT });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: PAYMENT_ACTIONS.RESET_FORM });
  }, []);

  const value = {
    // State
    ...state,
    
    // Actions
    setAmount,
    setRecipient,
    setAccountNumber,
    setBank,
    setReference,
    setError,
    setProcessing,
    setResult,
    updateFormData,
    resetPayment,
    resetForm
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext;
