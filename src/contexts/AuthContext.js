import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Authentication state structure
const initialAuthState = {
  currentStep: 'demo',
  authProgress: 0,
  isAuthenticating: false,
  authResult: null,
  faceResult: null,
  userPin: '',
  signatureData: null,
  isDrawing: false,
  signatureComplete: false,
  skipDemo: false
};

// Authentication actions
const AUTH_ACTIONS = {
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_AUTH_PROGRESS: 'SET_AUTH_PROGRESS',
  SET_AUTHENTICATING: 'SET_AUTHENTICATING',
  SET_AUTH_RESULT: 'SET_AUTH_RESULT',
  SET_FACE_RESULT: 'SET_FACE_RESULT',
  SET_USER_PIN: 'SET_USER_PIN',
  SET_SIGNATURE_DATA: 'SET_SIGNATURE_DATA',
  SET_IS_DRAWING: 'SET_IS_DRAWING',
  SET_SIGNATURE_COMPLETE: 'SET_SIGNATURE_COMPLETE',
  SET_SKIP_DEMO: 'SET_SKIP_DEMO',
  RESET_AUTH: 'RESET_AUTH',
  CLEAR_SIGNATURE: 'CLEAR_SIGNATURE'
};

// Authentication reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };
    
    case AUTH_ACTIONS.SET_AUTH_PROGRESS:
      return { ...state, authProgress: action.payload };
    
    case AUTH_ACTIONS.SET_AUTHENTICATING:
      return { ...state, isAuthenticating: action.payload };
    
    case AUTH_ACTIONS.SET_AUTH_RESULT:
      return { ...state, authResult: action.payload };
    
    case AUTH_ACTIONS.SET_FACE_RESULT:
      return { ...state, faceResult: action.payload };
    
    case AUTH_ACTIONS.SET_USER_PIN:
      return { ...state, userPin: action.payload };
    
    case AUTH_ACTIONS.SET_SIGNATURE_DATA:
      return { ...state, signatureData: action.payload };
    
    case AUTH_ACTIONS.SET_IS_DRAWING:
      return { ...state, isDrawing: action.payload };
    
    case AUTH_ACTIONS.SET_SIGNATURE_COMPLETE:
      return { ...state, signatureComplete: action.payload };
    
    case AUTH_ACTIONS.SET_SKIP_DEMO:
      return { ...state, skipDemo: action.payload };
    
    case AUTH_ACTIONS.RESET_AUTH:
      return { ...initialAuthState };
    
    case AUTH_ACTIONS.CLEAR_SIGNATURE:
      return {
        ...state,
        signatureData: null,
        signatureComplete: false,
        isDrawing: false
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Action creators
  const setCurrentStep = useCallback((step) => {
    dispatch({ type: AUTH_ACTIONS.SET_CURRENT_STEP, payload: step });
  }, []);

  const setAuthProgress = useCallback((progress) => {
    dispatch({ type: AUTH_ACTIONS.SET_AUTH_PROGRESS, payload: progress });
  }, []);

  const setAuthenticating = useCallback((isAuth) => {
    dispatch({ type: AUTH_ACTIONS.SET_AUTHENTICATING, payload: isAuth });
  }, []);

  const setAuthResult = useCallback((result) => {
    dispatch({ type: AUTH_ACTIONS.SET_AUTH_RESULT, payload: result });
  }, []);

  const setFaceResult = useCallback((result) => {
    dispatch({ type: AUTH_ACTIONS.SET_FACE_RESULT, payload: result });
  }, []);

  const setUserPin = useCallback((pin) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER_PIN, payload: pin });
  }, []);

  const setSignatureData = useCallback((data) => {
    dispatch({ type: AUTH_ACTIONS.SET_SIGNATURE_DATA, payload: data });
  }, []);

  const setIsDrawing = useCallback((drawing) => {
    dispatch({ type: AUTH_ACTIONS.SET_IS_DRAWING, payload: drawing });
  }, []);

  const setSignatureComplete = useCallback((complete) => {
    dispatch({ type: AUTH_ACTIONS.SET_SIGNATURE_COMPLETE, payload: complete });
  }, []);

  const setSkipDemo = useCallback((skip) => {
    dispatch({ type: AUTH_ACTIONS.SET_SKIP_DEMO, payload: skip });
  }, []);

  const resetAuth = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.RESET_AUTH });
  }, []);

  const clearSignature = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_SIGNATURE });
  }, []);

  // Authentication flow helpers
  const startAuthentication = useCallback(() => {
    setAuthenticating(true);
    setAuthProgress(0);
    setCurrentStep('face-auth');
  }, [setAuthenticating, setAuthProgress, setCurrentStep]);

  const completeAuthentication = useCallback((result) => {
    setAuthResult(result);
    setAuthenticating(false);
    setAuthProgress(100);
  }, [setAuthResult, setAuthenticating, setAuthProgress]);

  const value = {
    // State
    ...state,
    
    // Actions
    setCurrentStep,
    setAuthProgress,
    setAuthenticating,
    setAuthResult,
    setFaceResult,
    setUserPin,
    setSignatureData,
    setIsDrawing,
    setSignatureComplete,
    setSkipDemo,
    resetAuth,
    clearSignature,
    
    // Flow helpers
    startAuthentication,
    completeAuthentication
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
