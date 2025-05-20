import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserPanel } from '@/features/auth/components/UserPanel';

describe('UserPanel', () => {
  const mockUser = {
    email: 'test@example.com',
    lastLoginAt: '2024-03-20T10:00:00.000Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' }
    });
  });

  it('should render logout button', () => {
    render(<UserPanel user={mockUser} />);
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should handle successful logout', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true
    });

    render(<UserPanel user={mockUser} />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });

    await user.click(logoutButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST'
    });

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  it('should handle logout failure', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false
    });

    render(<UserPanel user={mockUser} />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });

    await user.click(logoutButton);

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST'
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle network error during logout', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<UserPanel user={mockUser} />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });

    await user.click(logoutButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('should show loading state during logout', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<UserPanel user={mockUser} />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });

    await user.click(logoutButton);

    expect(logoutButton).toBeDisabled();
    expect(screen.getByText('Logging out...')).toBeInTheDocument();

    await waitFor(() => {
      expect(logoutButton).not.toBeDisabled();
    });
  });
}); 