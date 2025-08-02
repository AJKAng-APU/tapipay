import { useState, useRef, useCallback } from 'react';

const useBehavioralData = (userId = "user_123") => {
  const [behavioralData, setBehavioralData] = useState({
    keystrokes: [],
    touchPatterns: [],
    userId,
    sessionId: `session_${Date.now()}`,
    geoIp: "MY", // This would come from actual geolocation
  });

  const keystrokeStartTimes = useRef({});
  const touchStartTimes = useRef({});

  // Record keystroke patterns
  const recordKeystroke = useCallback((key, eventType) => {
    const timestamp = Date.now();
    
    if (eventType === 'keydown') {
      keystrokeStartTimes.current[key] = timestamp;
    } else if (eventType === 'keyup' && keystrokeStartTimes.current[key]) {
      const startTime = keystrokeStartTimes.current[key];
      const dwellTime = timestamp - startTime;
      
      setBehavioralData(prev => ({
        ...prev,
        keystrokes: [...prev.keystrokes, {
          key,
          dwellTime,
          timestamp: startTime,
          pressure: Math.random() * 0.5 + 0.5, // Simulated pressure
        }]
      }));
      
      delete keystrokeStartTimes.current[key];
    }
  }, []);

  // Record touch patterns
  const recordTouch = useCallback((x, y, eventType, pressure = 0.5) => {
    const timestamp = Date.now();
    
    if (eventType === 'touchstart') {
      touchStartTimes.current[`${x}-${y}`] = timestamp;
    } else if (eventType === 'touchend') {
      const startTime = touchStartTimes.current[`${x}-${y}`] || timestamp;
      const duration = timestamp - startTime;
      
      setBehavioralData(prev => ({
        ...prev,
        touchPatterns: [...prev.touchPatterns, {
          x,
          y,
          pressure,
          duration,
          timestamp: startTime,
        }]
      }));
      
      delete touchStartTimes.current[`${x}-${y}`];
    }
  }, []);

  // Send behavioral data to backend
  const sendBehavioralData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/behavioral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(behavioralData),
      });

      if (response.ok) {
        console.log('✅ Behavioral data sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send behavioral data');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending behavioral data:', error);
      return false;
    }
  }, [behavioralData]);

  // Clear behavioral data
  const clearBehavioralData = useCallback(() => {
    setBehavioralData(prev => ({
      ...prev,
      keystrokes: [],
      touchPatterns: [],
      sessionId: `session_${Date.now()}`,
    }));
  }, []);

  // Get behavioral summary
  const getBehavioralSummary = useCallback(() => {
    const { keystrokes, touchPatterns } = behavioralData;
    
    return {
      keystrokeCount: keystrokes.length,
      touchCount: touchPatterns.length,
      avgKeystrokeDwell: keystrokes.length > 0 
        ? keystrokes.reduce((sum, k) => sum + k.dwellTime, 0) / keystrokes.length 
        : 0,
      avgTouchPressure: touchPatterns.length > 0
        ? touchPatterns.reduce((sum, t) => sum + t.pressure, 0) / touchPatterns.length
        : 0,
      sessionDuration: Date.now() - parseInt(behavioralData.sessionId.split('_')[1]),
    };
  }, [behavioralData]);

  return {
    behavioralData,
    recordKeystroke,
    recordTouch,
    sendBehavioralData,
    clearBehavioralData,
    getBehavioralSummary,
  };
};

export default useBehavioralData;
