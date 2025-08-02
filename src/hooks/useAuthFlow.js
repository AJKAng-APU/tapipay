import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import AuthService from '../services/authService';
import useBehavioralData from './useBehavioralData';

// Custom hook for authentication flow management
export const useAuthFlow = () => {
  const auth = useAuth();
  const user = useUser();
  const { behavioralData, sendBehavioralData, getBehavioralSummary } = useBehavioralData();

  // Start authentication process
  const startAuthentication = useCallback(() => {
    console.log('🔐 Starting authentication flow...');
    auth.startAuthentication();
  }, [auth]);

  // Handle face recognition demo (single/double click)
  const handleFaceRecognitionDemo = useCallback(async (shouldSucceed = true) => {
    try {
      auth.setAuthenticating(true);
      
      const result = await AuthService.simulateFaceRecognition(shouldSucceed);
      auth.setFaceResult(result);

      if (result.success) {
        // Face recognition successful
        auth.setCurrentStep('success');
        auth.completeAuthentication(result);
        return { success: true, result };
      } else {
        // Face recognition failed - require PIN step-up
        auth.setCurrentStep('pin-entry');
        return { success: false, requiresStepUp: true, result };
      }
    } catch (error) {
      console.error('❌ Face recognition demo failed:', error);
      auth.setAuthenticating(false);
      return { success: false, error: error.message };
    }
  }, [auth]);

  // Handle PIN validation
  const validatePIN = useCallback((pin) => {
    const result = AuthService.validatePIN(pin);
    auth.setUserPin(pin);

    if (result.success) {
      auth.setCurrentStep('success');
      auth.completeAuthentication(result);
    }

    return result;
  }, [auth]);

  // Handle signature validation
  const validateSignature = useCallback((signatureData) => {
    const result = AuthService.validateSignature(signatureData);
    
    if (result.success) {
      auth.setSignatureComplete(true);
    }

    return result;
  }, [auth]);

  // Complete authentication process
  const completeAuthentication = useCallback(async (paymentAmount) => {
    try {
      // Get authentication requirements
      const requirements = AuthService.getAuthRequirements(paymentAmount, false);
      
      // Collect all authentication methods used
      const authMethods = [];
      
      if (auth.faceResult?.success) {
        authMethods.push({ type: 'face', result: auth.faceResult });
      }
      
      if (auth.userPin && auth.authResult?.success) {
        authMethods.push({ type: 'pin', result: auth.authResult });
      }
      
      if (auth.signatureComplete) {
        authMethods.push({ type: 'signature', result: { success: true } });
      }

      // Generate security assessment
      const behavioralSummary = getBehavioralSummary();
      const securityAssessment = AuthService.generateSecurityAssessment(
        {
          face: auth.faceResult,
          pin: auth.authResult,
          signature: { success: auth.signatureComplete }
        },
        behavioralSummary
      );

      // Generate auth token
      const authToken = AuthService.generateAuthToken(user.profile.name, authMethods);

      // Send behavioral data
      await sendBehavioralData();

      // Set user as authenticated
      user.setAuthenticated(true);
      user.setAuthData({
        token: authToken,
        methods: authMethods,
        securityAssessment,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Authentication completed successfully');
      return {
        success: true,
        authToken,
        securityAssessment,
        methods: authMethods
      };

    } catch (error) {
      console.error('❌ Authentication completion failed:', error);
      return { success: false, error: error.message };
    }
  }, [auth, user, getBehavioralSummary, sendBehavioralData]);

  // Reset authentication flow
  const resetAuthentication = useCallback(() => {
    console.log('🔄 Resetting authentication flow...');
    auth.resetAuth();
    user.setAuthenticated(false);
    user.setAuthData(null);
  }, [auth, user]);

  // Check if current authentication is still valid
  const isAuthenticationValid = useCallback(() => {
    return AuthService.isAuthValid(user.authData);
  }, [user.authData]);

  // Get authentication requirements for payment
  const getAuthRequirements = useCallback((paymentAmount, isOffline = false) => {
    return AuthService.getAuthRequirements(paymentAmount, isOffline);
  }, []);

  return {
    // Auth state
    ...auth,
    
    // Auth actions
    startAuthentication,
    handleFaceRecognitionDemo,
    validatePIN,
    validateSignature,
    completeAuthentication,
    resetAuthentication,
    
    // Utilities
    isAuthenticationValid,
    getAuthRequirements,
    
    // Behavioral data
    behavioralData,
    behavioralSummary: getBehavioralSummary()
  };
};

export default useAuthFlow;
