import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use more specific selectors
    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true }).or(page.getByRole('textbox', { name: /^Password$/ }));
    this.submitButton = page.getByRole('button', { name: 'Sign in', exact: true });
    this.errorAlert = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?', exact: true });
  }

  async goto() {
    console.log('Navigating to login page...');
    await this.page.goto('/auth/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    console.log('Page loaded, waiting for form...');
    
    // Wait for the form and key elements with longer timeout
    await this.page.waitForSelector('form', { timeout: 60000, state: 'visible' });
    console.log('Form found, waiting for input fields...');
    
    // Wait for specific form elements
    await Promise.all([
      this.emailInput.waitFor({ state: 'visible', timeout: 60000 }),
      this.passwordInput.waitFor({ state: 'visible', timeout: 60000 }),
      this.submitButton.waitFor({ state: 'visible', timeout: 60000 })
    ]);
    console.log('All form elements are visible');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }

  async expectEmptyFieldError() {
    await this.submitButton.click();
    await expect(this.page.getByText('Email is required')).toBeVisible();
    await expect(this.page.getByText('Password is required')).toBeVisible();
  }

  async expectInvalidEmailError() {
    await this.emailInput.fill('invalid-email');
    await this.submitButton.click();
    await expect(this.page.getByText('Please enter a valid email address')).toBeVisible();
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await expect(this.page).toHaveURL('/auth/forgot-password');
  }
} 