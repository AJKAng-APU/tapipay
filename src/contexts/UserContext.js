import React, { createContext, useContext, useReducer, useCallback } from 'react';

// User state structure
const initialUserState = {
  profile: {
    name: "John Doe",
    balance: 2500.75,
    accountNumber: "**** 1234",
    bank: "grabpay",
    securityKey: "ABCD123",
  },
  isAuthenticated: false,
  authData: null,
  currentStep: "welcome"
};

// User actions
const USER_ACTIONS = {
  SET_PROFILE: 'SET_PROFILE',
  UPDATE_BALANCE: 'UPDATE_BALANCE',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_AUTH_DATA: 'SET_AUTH_DATA',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  LOGOUT: 'LOGOUT',
  DEDUCT_BALANCE: 'DEDUCT_BALANCE'
};

// User reducer
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_PROFILE:
      return { 
        ...state, 
        profile: { ...state.profile, ...action.payload } 
      };
    
    case USER_ACTIONS.UPDATE_BALANCE:
      return {
        ...state,
        profile: {
          ...state.profile,
          balance: action.payload
        }
      };
    
    case USER_ACTIONS.DEDUCT_BALANCE:
      const newBalance = Math.max(0, state.profile.balance - action.payload);
      return {
        ...state,
        profile: {
          ...state.profile,
          balance: newBalance
        }
      };
    
    case USER_ACTIONS.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload };
    
    case USER_ACTIONS.SET_AUTH_DATA:
      return { ...state, authData: action.payload };
    
    case USER_ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };
    
    case USER_ACTIONS.LOGOUT:
      return {
        ...initialUserState,
        profile: state.profile // Keep profile data
      };
    
    default:
      return state;
  }
};

// Create context
const UserContext = createContext();

// User provider component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialUserState);

  // Action creators
  const setProfile = useCallback((profileData) => {
    dispatch({ type: USER_ACTIONS.SET_PROFILE, payload: profileData });
  }, []);

  const updateBalance = useCallback((newBalance) => {
    dispatch({ type: USER_ACTIONS.UPDATE_BALANCE, payload: newBalance });
  }, []);

  const deductBalance = useCallback((amount) => {
    dispatch({ type: USER_ACTIONS.DEDUCT_BALANCE, payload: amount });
  }, []);

  const setAuthenticated = useCallback((isAuth) => {
    dispatch({ type: USER_ACTIONS.SET_AUTHENTICATED, payload: isAuth });
  }, []);

  const setAuthData = useCallback((authData) => {
    dispatch({ type: USER_ACTIONS.SET_AUTH_DATA, payload: authData });
  }, []);

  const setCurrentStep = useCallback((step) => {
    dispatch({ type: USER_ACTIONS.SET_CURRENT_STEP, payload: step });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: USER_ACTIONS.LOGOUT });
  }, []);

  // Utility functions
  const hasBalance = useCallback((amount) => {
    return state.profile.balance >= amount;
  }, [state.profile.balance]);

  const getFormattedBalance = useCallback(() => {
    return `RM${state.profile.balance.toFixed(2)}`;
  }, [state.profile.balance]);

  const value = {
    // State
    ...state,
    
    // Actions
    setProfile,
    updateBalance,
    deductBalance,
    setAuthenticated,
    setAuthData,
    setCurrentStep,
    logout,
    
    // Utilities
    hasBalance,
    getFormattedBalance
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
