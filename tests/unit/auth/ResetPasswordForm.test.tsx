import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

describe("ResetPasswordForm", () => {
  const token = "valid-token";
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should show validation errors when submitting empty form", async () => {
    render(<ResetPasswordForm token={token} />);
    const submitButton = screen.getByRole("button", { name: /reset password/i });

    await user.click(submitButton);

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("should show error when passwords do not match", async () => {
    render(<ResetPasswordForm token={token} />);
    const passwordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "DifferentPassword123!");
    await user.click(submitButton);

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("should handle successful password reset", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: "Password reset successful" }) };
    (global.fetch as Mock).mockResolvedValueOnce(mockResponse);
    const originalLocation = window.location;

    // Utwórz kopię lokalizacji z typem rozszerzonym o string
    const customLocation = { href: "" };
    Object.defineProperty(window, "location", {
      writable: true,
      value: customLocation,
    });

    render(<ResetPasswordForm token={token} />);
    const passwordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "Password123!");
    await user.click(submitButton);

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: "Password123!",
        token,
      }),
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/auth/login");
    });

    // Przywróć oryginalne window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("should handle password reset failure", async () => {
    const errorMessage = "Invalid or expired token";
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    };
    (global.fetch as Mock).mockResolvedValueOnce(mockResponse);

    render(<ResetPasswordForm token={token} />);
    const passwordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "Password123!");
    await user.click(submitButton);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });
  });

  it("should handle network error", async () => {
    const errorMessage = "Network error";
    (global.fetch as Mock).mockRejectedValueOnce(new Error(errorMessage));
    const originalLocation = window.location;

    // Utwórz kopię lokalizacji z typem rozszerzonym o string
    const customLocation = { href: "" };
    Object.defineProperty(window, "location", {
      writable: true,
      value: customLocation,
    });

    render(<ResetPasswordForm token={token} />);
    const passwordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "Password123!");
    await user.click(submitButton);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });

    // Przywróć oryginalne window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("should disable submit button during form submission", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: "Password reset successful" }) };
    (global.fetch as Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    );

    render(<ResetPasswordForm token={token} />);
    const passwordInput = screen.getByLabelText("New Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm New Password");
    const submitButton = screen.getByRole("button", { name: /reset password/i });

    await user.type(passwordInput, "Password123!");
    await user.type(confirmPasswordInput, "Password123!");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Resetting password...")).toBeInTheDocument();
  });
});
