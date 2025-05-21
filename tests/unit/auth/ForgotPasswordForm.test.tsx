import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { useAuthService } from "@/features/auth/hooks/useAuthService";

vi.mock("@/features/auth/hooks/useAuthService");

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.mocked(useAuthService).mockReturnValue({
      forgotPassword: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  it("should render form elements", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
  });

  it("should show validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const submitButton = screen.getByRole("button", { name: "Send reset link" });

    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("should show error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email address");
    const submitButton = screen.getByRole("button", { name: "Send reset link" });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid email address");
  });

  it("should handle successful password reset request", async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    vi.mocked(useAuthService).mockReturnValue({
      forgotPassword: mockForgotPassword,
      login: vi.fn(),
      register: vi.fn(),
      resetPassword: vi.fn(),
    });

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email address");
    const submitButton = screen.getByRole("button", { name: "Send reset link" });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    expect(mockForgotPassword).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(screen.getByText("Sending reset link...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("should handle password reset request failure", async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.fn().mockRejectedValue(new Error("User not found"));
    vi.mocked(useAuthService).mockReturnValue({
      forgotPassword: mockForgotPassword,
      login: vi.fn(),
      register: vi.fn(),
      resetPassword: vi.fn(),
    });

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email address");
    const submitButton = screen.getByRole("button", { name: "Send reset link" });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent("User not found");
  });

  it("should handle network error", async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.mocked(useAuthService).mockReturnValue({
      forgotPassword: mockForgotPassword,
      login: vi.fn(),
      register: vi.fn(),
      resetPassword: vi.fn(),
    });

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email address");
    const submitButton = screen.getByRole("button", { name: "Send reset link" });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
  });

  it("should disable submit button during form submission", async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    vi.mocked(useAuthService).mockReturnValue({
      forgotPassword: mockForgotPassword,
      login: vi.fn(),
      register: vi.fn(),
      resetPassword: vi.fn(),
    });

    render(<ForgotPasswordForm />);
    const emailInput = screen.getByLabelText("Email address");
    const submitButton = screen.getByRole("button", { name: "Send reset link" });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Sending reset link...")).toBeInTheDocument();
  });

  it("should navigate to login page when clicking sign in link", () => {
    render(<ForgotPasswordForm />);
    const signInLink = screen.getByRole("link", { name: "Sign in" });

    expect(signInLink).toHaveAttribute("href", "/auth/login");
  });
});
