import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/features/auth/components/LoginForm";

describe("LoginForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should render login form with all required fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should show validation errors for empty fields", async () => {
    render(<LoginForm />);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.click(submitButton);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("should show error for invalid email format", async () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText("Email address");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("should handle successful login", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: "Login successful" }) };
    (global.fetch as Mock).mockResolvedValueOnce(mockResponse);
    const originalLocation = window.location;

    // Utwórz kopię lokalizacji z typem rozszerzonym o string
    const customLocation = { href: "" };
    Object.defineProperty(window, "location", {
      writable: true,
      value: customLocation,
    });

    render(<LoginForm />);
    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123!",
      }),
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });

    // Przywróć oryginalne window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("should handle login failure", async () => {
    const errorMessage = "Invalid credentials";
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: errorMessage }),
    };
    (global.fetch as Mock).mockResolvedValueOnce(mockResponse);

    render(<LoginForm />);
    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
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

    render(<LoginForm />);
    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(errorMessage);
    });
  });

  it("should toggle password visibility", async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: /(show|hide) password/i });

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should disable submit button during form submission", async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ message: "Login successful" }) };
    (global.fetch as Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    );

    render(<LoginForm />);
    const emailInput = screen.getByLabelText("Email address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "Password123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });
  });

  it("should navigate to register page when clicking sign up link", () => {
    render(<LoginForm />);
    const signUpLink = screen.getByRole("link", { name: /sign up/i });

    expect(signUpLink).toHaveAttribute("href", "/auth/register");
  });

  it("should navigate to forgot password page when clicking forgot password link", () => {
    render(<LoginForm />);
    const forgotPasswordLink = screen.getByRole("link", { name: /forgot password/i });

    expect(forgotPasswordLink).toHaveAttribute("href", "/auth/forgot-password");
  });
});
