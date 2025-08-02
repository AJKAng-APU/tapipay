import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { PaymentProvider, usePayment } from '../../contexts/PaymentContext';

// Test wrapper component
const TestWrapper = ({ children }) => (
  <PaymentProvider>{children}</PaymentProvider>
);

describe('PaymentContext', () => {
  test('provides initial payment state', () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: TestWrapper,
    });

    expect(result.current.amount).toBe('');
    expect(result.current.recipient).toBe('');
    expect(result.current.accountNumber).toBe('');
    expect(result.current.bank).toBe('');
    expect(result.current.reference).toBe('');
    expect(result.current.error).toBe('');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.result).toBe(null);
  });

  test('updates payment amount', () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setAmount('100');
    });

    expect(result.current.amount).toBe('100');
  });

  test('updates form data', () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.updateFormData({
        recipient: 'John Doe',
        bank: 'maybank'
      });
    });

    expect(result.current.formData.recipient).toBe('John Doe');
    expect(result.current.formData.bank).toBe('maybank');
  });

  test('resets payment state', () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: TestWrapper,
    });

    // Set some data first
    act(() => {
      result.current.setAmount('100');
      result.current.setRecipient('John Doe');
      result.current.setError('Test error');
    });

    // Reset payment
    act(() => {
      result.current.resetPayment();
    });

    expect(result.current.amount).toBe('');
    expect(result.current.recipient).toBe('');
    expect(result.current.error).toBe('');
  });

  test('sets processing state', () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setProcessing(true);
    });

    expect(result.current.isProcessing).toBe(true);

    act(() => {
      result.current.setProcessing(false);
    });

    expect(result.current.isProcessing).toBe(false);
  });

  test('sets payment result', () => {
    const { result } = renderHook(() => usePayment(), {
      wrapper: TestWrapper,
    });

    const mockResult = {
      success: true,
      transactionId: 'PAY_123',
      amount: 100
    };

    act(() => {
      result.current.setResult(mockResult);
    });

    expect(result.current.result).toEqual(mockResult);
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => usePayment());
    }).toThrow('usePayment must be used within a PaymentProvider');

    consoleSpy.mockRestore();
  });
});
