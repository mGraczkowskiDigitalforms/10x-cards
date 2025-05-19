import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../../../src/components/auth/RegisterForm';
import { act } from 'react-dom/test-utils';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  it('should render registration form with all required fields', () => {
    // Act
    render(<RegisterForm />);

    // Assert
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/please confirm your password/i)).toBeInTheDocument();
  });

  it('should show error for invalid email format', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('should show error for password less than 8 characters', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockUser = { id: '123', email: 'test@example.com' };
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser })
    });

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  it('should handle registration failure', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Email already exists' })
    });

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('should handle network error', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const toggleButtons = screen.getAllByRole('button', { name: /show password/i });

    // Act & Assert for password field
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Act & Assert for confirm password field
    await user.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should disable submit button during form submission', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    expect(submitButton).toBeDisabled();
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should navigate to login page when clicking sign in link', async () => {
    // Arrange
    render(<RegisterForm />);
    const signInLink = screen.getByRole('link', { name: /sign in/i });

    // Assert
    expect(signInLink).toHaveAttribute('href', '/auth/login');
  });

  it('should preserve form data after failed registration attempt', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Email already exists' })
    });

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });
  });

  it('should show loading state during form submission', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });

  it('should disable form inputs during submission', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/^confirm password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    // Assert
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
  });

  it('should show validation errors on blur', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act & Assert for email
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Move focus away from email input
    await user.click(submitButton);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();

    // Act & Assert for password
    await user.type(passwordInput, '123');
    await user.tab(); // Move focus away from password input
    await user.click(submitButton);

    expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it('should clear validation errors when correcting input', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RegisterForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Act - first enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    // Assert error is shown
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();

    // Act - correct the email
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@email.com');
    await user.click(submitButton);

    // Assert error is cleared
    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });
}); 