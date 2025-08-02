// Authentication Service - Handles all authentication-related business logic

export class AuthService {
  // Simulate face recognition authentication
  static async simulateFaceRecognition(shouldSucceed = true) {
    try {
      console.log('🔍 Starting face recognition simulation...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (shouldSucceed) {
        const result = {
          success: true,
          confidence: 0.95,
          method: 'face_recognition',
          timestamp: new Date().toISOString(),
          message: 'Face recognition successful'
        };
        console.log('✅ Face recognition successful:', result);
        return result;
      } else {
        const result = {
          success: false,
          confidence: 0.45,
          method: 'face_recognition',
          timestamp: new Date().toISOString(),
          message: 'Face recognition failed - low confidence',
          requiresStepUp: true
        };
        console.log('❌ Face recognition failed:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Face recognition error:', error);
      throw error;
    }
  }

  // Validate PIN authentication
  static validatePIN(enteredPin, expectedPin = '1234') {
    const isValid = enteredPin === expectedPin;
    
    const result = {
      success: isValid,
      method: 'pin',
      timestamp: new Date().toISOString(),
      message: isValid ? 'PIN authentication successful' : 'Invalid PIN entered'
    };

    console.log(isValid ? '✅ PIN valid' : '❌ PIN invalid:', result);
    return result;
  }

  // Validate signature completeness
  static validateSignature(signatureData) {
    if (!signatureData || !signatureData.length) {
      return {
        success: false,
        message: 'No signature provided'
      };
    }

    // Simple validation - check if signature has enough points
    const isValid = signatureData.length >= 10;
    
    const result = {
      success: isValid,
      method: 'signature',
      timestamp: new Date().toISOString(),
      message: isValid ? 'Signature captured successfully' : 'Signature too short'
    };

    console.log(isValid ? '✅ Signature valid' : '❌ Signature invalid:', result);
    return result;
  }

  // Process multi-factor authentication
  static async processMultiFactorAuth(authMethods) {
    try {
      const results = [];
      let overallSuccess = true;

      for (const method of authMethods) {
        let result;
        
        switch (method.type) {
          case 'face':
            result = await this.simulateFaceRecognition(method.shouldSucceed);
            break;
          case 'pin':
            result = this.validatePIN(method.pin);
            break;
          case 'signature':
            result = this.validateSignature(method.signatureData);
            break;
          default:
            result = { success: false, message: 'Unknown auth method' };
        }

        results.push(result);
        if (!result.success) {
          overallSuccess = false;
        }
      }

      const finalResult = {
        success: overallSuccess,
        methods: results,
        timestamp: new Date().toISOString(),
        message: overallSuccess ? 'Multi-factor authentication successful' : 'Authentication failed'
      };

      console.log('🔐 Multi-factor auth result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('❌ Multi-factor auth error:', error);
      throw error;
    }
  }

  // Generate authentication token (mock)
  static generateAuthToken(userId, authMethods) {
    const token = {
      userId,
      methods: authMethods.map(m => m.type),
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      token: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('🎫 Generated auth token:', token);
    return token;
  }

  // Validate authentication requirements based on payment amount and mode
  static getAuthRequirements(paymentAmount, isOffline = false) {
    const amount = parseFloat(paymentAmount);
    const requirements = {
      face: true, // Always require face recognition
      pin: false,
      signature: isOffline, // Signature required for offline payments
      behavioral: true // Always collect behavioral data
    };

    // Step-up authentication for high-value transactions
    if (amount >= 1000) {
      requirements.pin = true;
    }

    console.log('🔒 Auth requirements for', `RM${amount}`, isOffline ? '(offline)' : '(online)', ':', requirements);
    return requirements;
  }

  // Check if authentication is still valid
  static isAuthValid(authData) {
    if (!authData || !authData.timestamp) {
      return false;
    }

    const authTime = new Date(authData.timestamp);
    const now = new Date();
    const timeDiff = now - authTime;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    return timeDiff < maxAge;
  }

  // Generate security assessment
  static generateSecurityAssessment(authResults, behavioralData) {
    let score = 0;
    const factors = [];

    // Face recognition score
    if (authResults.face?.success) {
      score += 40;
      factors.push('Face Recognition: Verified');
    }

    // PIN score
    if (authResults.pin?.success) {
      score += 30;
      factors.push('PIN: Verified');
    }

    // Signature score
    if (authResults.signature?.success) {
      score += 20;
      factors.push('Signature: Captured');
    }

    // Behavioral score
    if (behavioralData?.keystrokeCount > 5 && behavioralData?.touchCount > 3) {
      score += 10;
      factors.push('Behavioral: High Confidence');
    }

    const assessment = {
      score: Math.min(score, 100),
      level: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
      factors,
      timestamp: new Date().toISOString()
    };

    console.log('🛡️ Security assessment:', assessment);
    return assessment;
  }
}

export default AuthService;
