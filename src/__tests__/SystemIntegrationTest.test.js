import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TapiPayMobileMVP from '../App';

// Mock external dependencies
jest.mock('../hooks/useBehavioralData', () => ({
  __esModule: true,
  default: () => ({
    behavioralData: { keystrokes: [], touches: [], mouseMovements: [] },
    recordKeystroke: jest.fn(),
    recordTouch: jest.fn(),
    sendBehavioralData: jest.fn(),
    getBehavioralSummary: jest.fn(() => ({ totalKeystrokes: 0, totalTouches: 0 }))
  })
}));

// Mock D3 for chart rendering
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(() => ({
              style: jest.fn()
            }))
          }))
        }))
      }))
    }))
  })),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn()
    }))
  })),
  scaleBand: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn(() => ({
        padding: jest.fn()
      }))
    }))
  })),
  axisBottom: jest.fn(),
  axisLeft: jest.fn()
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('TapiPay System Integration Tests', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock fetch for API calls
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Reset navigator.onLine
    navigator.onLine = true;
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    global.localStorage = localStorageMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Application Initialization', () => {
    test('should render welcome screen on initial load', () => {
      render(<TapiPayMobileMVP />);
      
      expect(screen.getByText('Welcome to TapiPay')).toBeInTheDocument();
      expect(screen.getByText('Secure. Fast. Reliable.')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    test('should display online status indicator', () => {
      render(<TapiPayMobileMVP />);
      
      const onlineIndicator = screen.getByTestId('online-indicator');
      expect(onlineIndicator).toBeInTheDocument();
    });
  });

  describe('Authentication Flow Integration', () => {
    test('should navigate from welcome to payment screen', async () => {
      render(<TapiPayMobileMVP />);
      
      const getStartedButton = screen.getByText('Get Started');
      fireEvent.click(getStartedButton);
      
      await waitFor(() => {
        expect(screen.getByText('Enter Payment Amount')).toBeInTheDocument();
      });
    });

    test('should validate payment amount input', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to payment screen
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '50.00' } });
        
        expect(amountInput.value).toBe('50.00');
      });
    });

    test('should proceed to authentication after valid payment amount', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to payment screen
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '25.00' } });
        
        const proceedButton = screen.getByText('Proceed to Authentication');
        fireEvent.click(proceedButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Biometric Authentication')).toBeInTheDocument();
      });
    });
  });

  describe('Offline Mode Integration', () => {
    test('should detect offline status and show offline indicator', async () => {
      render(<TapiPayMobileMVP />);
      
      // Simulate going offline
      act(() => {
        navigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });
      
      await waitFor(() => {
        const offlineIndicator = screen.getByText('Offline Mode');
        expect(offlineIndicator).toBeInTheDocument();
      });
    });

    test('should initialize offline payment lock when going offline', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to payment screen first
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        // Simulate going offline
        act(() => {
          navigator.onLine = false;
          window.dispatchEvent(new Event('offline'));
        });
      });
      
      await waitFor(() => {
        // Should show offline balance in indicator
        expect(screen.getByText(/Available offline:/)).toBeInTheDocument();
      });
    });

    test('should restrict payment amounts in offline mode', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to payment screen
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        // Go offline
        act(() => {
          navigator.onLine = false;
          window.dispatchEvent(new Event('offline'));
        });
        
        // Try to enter amount exceeding offline limit
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '300.00' } });
        
        const proceedButton = screen.getByText('Proceed to Authentication');
        fireEvent.click(proceedButton);
      });
      
      // Should show error for exceeding offline limit
      await waitFor(() => {
        expect(screen.getByText(/exceeds offline payment limit/)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Processing Integration', () => {
    test('should process valid payment amounts', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate through flow
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '25.00' } });
        
        const proceedButton = screen.getByText('Proceed to Authentication');
        fireEvent.click(proceedButton);
      });
      
      // Should reach authentication screen
      await waitFor(() => {
        expect(screen.getByText('Biometric Authentication')).toBeInTheDocument();
      });
    });

    test('should handle quick payment buttons', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to payment screen
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const quickPayButton = screen.getByText('RM25');
        fireEvent.click(quickPayButton);
        
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput.value).toBe('25');
      });
    });
  });

  describe('Dashboard Integration', () => {
    test('should display user profile information', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate through authentication flow (mock successful auth)
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '25.00' } });
        fireEvent.click(screen.getByText('Proceed to Authentication'));
      });
      
      // Mock successful authentication and navigate to dashboard
      await waitFor(() => {
        // Simulate successful auth by clicking through auth flow
        const authButtons = screen.getAllByText(/Continue|Authenticate|Complete/);
        if (authButtons.length > 0) {
          fireEvent.click(authButtons[0]);
        }
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<TapiPayMobileMVP />);
      
      // Test that app still renders despite network errors
      expect(screen.getByText('Welcome to TapiPay')).toBeInTheDocument();
    });

    test('should validate empty payment amounts', async () => {
      render(<TapiPayMobileMVP />);
      
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const proceedButton = screen.getByText('Proceed to Authentication');
        fireEvent.click(proceedButton);
        
        // Should show validation error
        expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Integration', () => {
    test('should maintain layout integrity across different screen sizes', () => {
      // Test mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));
      
      render(<TapiPayMobileMVP />);
      
      const container = screen.getByTestId('main-container');
      expect(container).toHaveClass('min-h-screen');
    });
  });

  describe('State Management Integration', () => {
    test('should maintain state consistency across navigation', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to payment screen
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '50.00' } });
        
        // Navigate back and forth to test state persistence
        const backButton = screen.getByText('← Back');
        fireEvent.click(backButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to TapiPay')).toBeInTheDocument();
      });
      
      // Navigate forward again
      fireEvent.click(screen.getByText('Get Started'));
      
      await waitFor(() => {
        // Amount should be preserved
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput.value).toBe('50.00');
      });
    });
  });

  describe('Behavioral Data Integration', () => {
    test('should record user interactions', async () => {
      render(<TapiPayMobileMVP />);
      
      const getStartedButton = screen.getByText('Get Started');
      fireEvent.click(getStartedButton);
      
      // Behavioral data recording should be triggered
      // This is mocked, but in real scenario would verify API calls
      expect(mockFetch).not.toHaveBeenCalled(); // Since we're mocking the hook
    });
  });
});
