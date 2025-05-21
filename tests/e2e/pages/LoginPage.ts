import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly forgotPasswordLink: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use more specific selectors
    this.emailInput = page.getByRole("textbox", { name: "Email address" });
    this.passwordInput = page.locator('[data-test-id="login-password-input"]');
    this.submitButton = page.getByRole("button", { name: "Sign in", exact: true });
    this.errorAlert = page.locator('[data-test-id="login-error-message"]');
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot password?", exact: true });
    this.emailError = page.locator("#email-error");
    this.passwordError = page.locator("#password-error");
  }

  async goto() {
    console.log("Navigating to login page...");
    await this.page.goto("/auth/login", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    console.log("Page loaded, waiting for form...");

    // Wait for the form and key elements with longer timeout
    await this.page.waitForSelector("form", { timeout: 60000, state: "visible" });
    console.log("Form found, waiting for input fields...");

    // Wait for specific form elements
    await Promise.all([
      this.emailInput.waitFor({ state: "visible", timeout: 60000 }),
      this.passwordInput.waitFor({ state: "visible", timeout: 60000 }),
      this.submitButton.waitFor({ state: "visible", timeout: 60000 }),
    ]);
    console.log("All form elements are visible");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    // Wait for the error alert to be visible with a longer timeout
    await expect(this.errorAlert).toBeVisible({ timeout: 60000 });
    await expect(this.errorAlert).toContainText(message, { timeout: 60000 });
  }

  async expectEmptyFieldError() {
    await this.submitButton.click();

    // Check email error
    await expect(this.emailError).toBeVisible({ timeout: 60000 });
    const emailErrorText = await this.emailError.textContent();
    expect(emailErrorText).toBe("Email is required");

    // Check password error
    await expect(this.passwordError).toBeVisible({ timeout: 60000 });
    const passwordErrorText = await this.passwordError.textContent();
    expect(passwordErrorText).toBe("Password is required");
  }

  async expectInvalidEmailError() {
    await this.emailInput.fill("invalid-email");
    await this.submitButton.click();
    await expect(this.emailError).toBeVisible({ timeout: 60000 });
    const emailErrorText = await this.emailError.textContent();
    expect(emailErrorText).toBe("Please enter a valid email address");
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await expect(this.page).toHaveURL("/auth/forgot-password");
  }
}
