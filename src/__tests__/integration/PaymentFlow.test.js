import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProvider } from '../../contexts/UserContext';
import { PaymentProvider } from '../../contexts/PaymentContext';
import { OfflineProvider } from '../../contexts/OfflineContext';
import { AuthProvider } from '../../contexts/AuthContext';
import PaymentScreen from '../../components/screens/PaymentScreen';

// Test wrapper with all providers
const TestWrapper = ({ children }) => (
  <UserProvider>
    <OfflineProvider>
      <PaymentProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </PaymentProvider>
    </OfflineProvider>
  </UserProvider>
);

// Mock functions
const mockOnBack = jest.fn();
const mockOnProceedToAuth = jest.fn();
const mockOnShowQRScanner = jest.fn();

describe('Payment Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders payment form with all required fields', () => {
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Recipient Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Account Number')).toBeInTheDocument();
    expect(screen.getByText('Select Bank')).toBeInTheDocument();
    expect(screen.getByText('Proceed to Authentication')).toBeInTheDocument();
  });

  test('enables proceed button when all fields are filled', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    const proceedButton = screen.getByText('Proceed to Authentication');
    expect(proceedButton).toBeDisabled();

    // Fill in form fields
    await user.type(screen.getByPlaceholderText('0.00'), '100');
    await user.type(screen.getByPlaceholderText('Recipient Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Account Number'), '1234567890');
    
    // Select a bank
    await user.click(screen.getByText('Maybank'));

    await waitFor(() => {
      expect(proceedButton).not.toBeDisabled();
    });
  });

  test('shows quick amount buttons and updates amount', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    const quickAmountButton = screen.getByText('RM50');
    await user.click(quickAmountButton);

    const amountInput = screen.getByPlaceholderText('0.00');
    expect(amountInput.value).toBe('50');
  });

  test('displays payment summary when amount is entered', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    await user.type(screen.getByPlaceholderText('0.00'), '150');

    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      expect(screen.getByText('RM150.00')).toBeInTheDocument();
    });
  });

  test('calls onProceedToAuth when form is valid and submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    // Fill in all required fields
    await user.type(screen.getByPlaceholderText('0.00'), '100');
    await user.type(screen.getByPlaceholderText('Recipient Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Account Number'), '1234567890');
    await user.click(screen.getByText('Maybank'));

    const proceedButton = screen.getByText('Proceed to Authentication');
    await user.click(proceedButton);

    expect(mockOnProceedToAuth).toHaveBeenCalledTimes(1);
  });

  test('shows QR scanner button and calls handler', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    const qrButton = screen.getByText('Scan QR');
    await user.click(qrButton);

    expect(mockOnShowQRScanner).toHaveBeenCalledTimes(1);
  });

  test('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    const backButton = screen.getByText('Back');
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test('shows validation error for invalid form submission', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <PaymentScreen
          onBack={mockOnBack}
          onProceedToAuth={mockOnProceedToAuth}
          onShowQRScanner={mockOnShowQRScanner}
        />
      </TestWrapper>
    );

    // Try to submit with only amount filled
    await user.type(screen.getByPlaceholderText('0.00'), '100');
    
    const proceedButton = screen.getByText('Proceed to Authentication');
    expect(proceedButton).toBeDisabled();
  });
});
