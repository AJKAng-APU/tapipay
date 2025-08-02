// Network Service - Handles network status and connectivity

export class NetworkService {
  static listeners = new Set();

  // Initialize network monitoring
  static initialize() {
    console.log('🌐 Initializing network service...');
    
    // Add event listeners for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Log initial status
    console.log('📡 Initial network status:', navigator.onLine ? 'Online' : 'Offline');
  }

  // Cleanup network monitoring
  static cleanup() {
    console.log('🧹 Cleaning up network service...');
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners.clear();
  }

  // Handle online event
  static handleOnline() {
    console.log('🌐 Network: Connected');
    this.notifyListeners({ isOnline: true, timestamp: new Date().toISOString() });
  }

  // Handle offline event
  static handleOffline() {
    console.log('📴 Network: Disconnected');
    this.notifyListeners({ isOnline: false, timestamp: new Date().toISOString() });
  }

  // Add network status listener
  static addListener(callback) {
    this.listeners.add(callback);
    
    // Immediately notify with current status
    callback({
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString()
    });
  }

  // Remove network status listener
  static removeListener(callback) {
    this.listeners.delete(callback);
  }

  // Notify all listeners of network status change
  static notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('❌ Error in network listener:', error);
      }
    });
  }

  // Get current network status
  static getStatus() {
    return {
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString(),
      connection: this.getConnectionInfo()
    };
  }

  // Get connection information (if available)
  static getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      };
    }
    return null;
  }

  // Test network connectivity
  static async testConnectivity(timeout = 5000) {
    try {
      console.log('🔍 Testing network connectivity...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      const result = {
        isConnected: response.ok,
        status: response.status,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - performance.now()
      };

      console.log('✅ Connectivity test result:', result);
      return result;
    } catch (error) {
      console.log('❌ Connectivity test failed:', error.message);
      return {
        isConnected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Monitor network quality
  static startQualityMonitoring(interval = 30000) {
    console.log('📊 Starting network quality monitoring...');
    
    const monitor = setInterval(async () => {
      const status = this.getStatus();
      const connectivity = await this.testConnectivity();
      
      const quality = {
        ...status,
        ...connectivity,
        quality: this.assessNetworkQuality(connectivity)
      };

      this.notifyListeners({ type: 'quality', data: quality });
    }, interval);

    return () => {
      console.log('🛑 Stopping network quality monitoring...');
      clearInterval(monitor);
    };
  }

  // Assess network quality based on connectivity test
  static assessNetworkQuality(connectivity) {
    if (!connectivity.isConnected) {
      return 'offline';
    }

    const responseTime = connectivity.responseTime || 0;
    
    if (responseTime < 100) return 'excellent';
    if (responseTime < 300) return 'good';
    if (responseTime < 1000) return 'fair';
    return 'poor';
  }

  // Handle network mode switching
  static async switchToOfflineMode() {
    console.log('📴 Switching to offline mode...');
    
    // Notify listeners about mode switch
    this.notifyListeners({
      type: 'mode_switch',
      mode: 'offline',
      timestamp: new Date().toISOString()
    });

    return { success: true, mode: 'offline' };
  }

  static async switchToOnlineMode() {
    console.log('🌐 Switching to online mode...');
    
    // Test connectivity first
    const connectivity = await this.testConnectivity();
    
    if (connectivity.isConnected) {
      this.notifyListeners({
        type: 'mode_switch',
        mode: 'online',
        timestamp: new Date().toISOString()
      });
      return { success: true, mode: 'online' };
    } else {
      console.log('❌ Cannot switch to online mode - no connectivity');
      return { success: false, mode: 'offline', error: 'No connectivity' };
    }
  }
}

export default NetworkService;
