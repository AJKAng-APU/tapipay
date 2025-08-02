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

describe('TapiPay Focused Integration Tests', () => {
  beforeEach(() => {
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

  describe('Core Application Flow', () => {
    test('should render welcome screen with correct elements', () => {
      render(<TapiPayMobileMVP />);
      
      // Check for main branding
      expect(screen.getByText('TapiPay')).toBeInTheDocument();
      expect(screen.getByText('Future-Proof Payments')).toBeInTheDocument();
      
      // Check for main action button
      expect(screen.getByText('Make Bank Transfer')).toBeInTheDocument();
      
      // Check for feature highlights
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText('Quantum-Ready')).toBeInTheDocument();
      expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    });

    test('should navigate to bank transfer screen', async () => {
      render(<TapiPayMobileMVP />);
      
      const transferButton = screen.getByText('Make Bank Transfer');
      fireEvent.click(transferButton);
      
      await waitFor(() => {
        expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
      });
    });

    test('should display online status indicator', () => {
      render(<TapiPayMobileMVP />);
      
      // Should show online status
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('Offline Mode Integration', () => {
    test('should detect offline status and initialize payment lock', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to transfer screen first
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        // Simulate going offline
        act(() => {
          navigator.onLine = false;
          window.dispatchEvent(new Event('offline'));
        });
      });
      
      await waitFor(() => {
        // Should show offline mode
        expect(screen.getByText('Offline Mode')).toBeInTheDocument();
      });
    });

    test('should show offline balance in indicator', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to transfer screen
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        // Go offline
        act(() => {
          navigator.onLine = false;
          window.dispatchEvent(new Event('offline'));
        });
      });
      
      await waitFor(() => {
        // Should show available offline balance
        const offlineText = screen.getByText(/Available offline:/);
        expect(offlineText).toBeInTheDocument();
      });
    });
  });

  describe('Payment Form Integration', () => {
    test('should validate payment form fields', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to transfer screen
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        // Try to proceed without filling required fields
        const proceedButton = screen.getByText('Proceed to Authentication');
        fireEvent.click(proceedButton);
        
        // Should show validation error
        expect(screen.getByText(/Please enter/)).toBeInTheDocument();
      });
    });

    test('should handle amount input', async () => {
      render(<TapiPayMobileMVP />);
      
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '50.00' } });
        
        expect(amountInput.value).toBe('50.00');
      });
    });

    test('should handle quick payment buttons', async () => {
      render(<TapiPayMobileMVP />);
      
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        const quickPayButton = screen.getByText('RM25');
        fireEvent.click(quickPayButton);
        
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput.value).toBe('25');
      });
    });
  });

  describe('State Management', () => {
    test('should maintain state during navigation', async () => {
      render(<TapiPayMobileMVP />);
      
      // Navigate to transfer screen
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        // Enter amount
        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100.00' } });
        
        // Navigate back
        const backButton = screen.getByText('← Back');
        fireEvent.click(backButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('TapiPay')).toBeInTheDocument();
      });
      
      // Navigate forward again
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        const amountInput = screen.getByPlaceholderText('0.00');
        expect(amountInput.value).toBe('100.00');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle empty form submission gracefully', async () => {
      render(<TapiPayMobileMVP />);
      
      fireEvent.click(screen.getByText('Make Bank Transfer'));
      
      await waitFor(() => {
        const proceedButton = screen.getByText('Proceed to Authentication');
        fireEvent.click(proceedButton);
        
        // Should show validation message without crashing
        expect(screen.getByText(/Please enter/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('should maintain mobile layout structure', () => {
      render(<TapiPayMobileMVP />);
      
      // Check for mobile container structure
      const mobileContainer = document.querySelector('[style*="width: 375px"]');
      expect(mobileContainer).toBeInTheDocument();
    });
  });
});
