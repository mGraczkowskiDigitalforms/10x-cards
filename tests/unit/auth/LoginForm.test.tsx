import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../../src/components/auth/LoginForm';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  }))
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form with all required fields', () => {
    // Act
    render(<LoginForm />);

    // Assert
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('should show error for invalid email format', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // Assert
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockUser = { id: '123', email: 'test@example.com' };
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser })
    });

    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
  });

  it('should handle login failure', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    });

    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle network error', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Act
    await user.click(toggleButton);

    // Assert
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Act - toggle back
    await user.click(toggleButton);

    // Assert
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should disable submit button during form submission', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Assert
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should navigate to registration page when clicking sign up link', async () => {
    // Arrange
    render(<LoginForm />);
    const signUpLink = screen.getByRole('link', { name: /sign up/i });

    // Assert
    expect(signUpLink).toHaveAttribute('href', '/auth/register');
  });

  it('should navigate to forgot password page when clicking forgot password link', async () => {
    // Arrange
    render(<LoginForm />);
    const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });

    // Assert
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('should redirect to home page after successful login', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { id: '123', email: 'test@example.com' } })
    });

    // Mock window.location.href
    const originalHref = window.location.href;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });

    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });

    // Cleanup
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: originalHref }
    });
  });

  it('should preserve form data after failed login attempt', async () => {
    // Arrange
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    });

    render(<LoginForm />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Act
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('wrongpassword');
    });
  });

  it('should show terms of service and privacy policy links', () => {
    // Arrange
    render(<LoginForm />);

    // Assert
    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });

    expect(termsLink).toHaveAttribute('href', 'https://10xcards.com/terms');
    expect(privacyLink).toHaveAttribute('href', 'https://10xcards.com/privacy');
  });
}); 