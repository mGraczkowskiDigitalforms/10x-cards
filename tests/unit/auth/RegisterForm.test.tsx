import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

describe('RegisterForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render registration form with all required fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    render(<RegisterForm />);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('should show error for invalid email format', async () => {
    render(<RegisterForm />);
    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('should show error for password less than 8 characters', async () => {
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    render(<RegisterForm />);
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(submitButton);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Registration successful' }) };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(<RegisterForm />);
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
      }),
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });

    window.location = originalLocation;
  });

  it('should handle registration failure', async () => {
    const errorMessage = 'Email already exists';
    const mockResponse = { 
      ok: false, 
      json: () => Promise.resolve({ error: errorMessage }) 
    };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    render(<RegisterForm />);
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });
  });

  it('should handle network error', async () => {
    const errorMessage = 'Network error';
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error(errorMessage));

    render(<RegisterForm />);
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });
  });

  it('should toggle password visibility', async () => {
    render(<RegisterForm />);
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const toggleButtons = screen.getAllByRole('button', { name: /(show|hide) password/i });

    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    await user.click(toggleButtons[1]);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should disable submit button during form submission', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Registration successful' }) };
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100)));

    render(<RegisterForm />);
    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });
  });

  it('should navigate to login page when clicking sign in link', () => {
    render(<RegisterForm />);
    const signInLink = screen.getByRole('link', { name: /sign in/i });

    expect(signInLink).toHaveAttribute('href', '/auth/login');
  });
}); 