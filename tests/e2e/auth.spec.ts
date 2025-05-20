import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  // Test data from .env.test
  const TEST_USER = {
    email: 'mariusz@test.pl',
    password: 'Test1234%'
  };

  test.beforeEach(async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => console.error(`Browser error: ${err}`));

    // Listen to network requests
    page.on('request', request => {
      if (request.url().includes('/api/auth/login')) {
        console.log(`Request to ${request.url()}: ${request.method()}`);
        console.log('Request body:', request.postData());
      }
    });
    page.on('response', async response => {
      if (response.url().includes('/api/auth/login')) {
        console.log(`Response from ${response.url()}: ${response.status()}`);
        try {
          const body = await response.json();
          console.log('Response body:', body);
        } catch (e) {
          console.log('Failed to parse response body');
        }
      }
    });

    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should redirect to login page when accessing dashboard while not authenticated', async ({ page }) => {
    // Try to access generate page directly
    await page.goto('/generate');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/auth/login');
  });

  test('should redirect to generate page and show user info after successful login', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    
    // Should be redirected to generate page
    await expect(page).toHaveURL('/generate', { timeout: 10000 });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Debug: Log the page content
    console.log('Page HTML:', await page.content());
    
    // Wait for the main container to be visible
    await expect(page.locator('[data-test-id="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    
    // Check if user email is displayed
    const emailElement = page.locator('text=' + TEST_USER.email);
    await expect(emailElement).toBeVisible({ timeout: 10000 });
    
    // Check if last login info is displayed
    await expect(page.locator('text=Last login:')).toBeVisible();
    
    // Check if the generate flashcards heading is visible
    await expect(page.locator('h1:has-text("Generate Flashcards")')).toBeVisible();
  });

  test('should show error message for invalid credentials', async () => {
    await loginPage.goto();
    // Use a properly formatted password but with invalid credentials
    await loginPage.login('invalid@email.com', 'Test1234');
    await loginPage.expectErrorMessage('Invalid credentials');
    
    // Should stay on login page
    await expect(loginPage.page).toHaveURL('/auth/login');
  });

  test('should validate password format', async () => {
    await loginPage.goto();
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('weakpassword');
    await loginPage.submitButton.click();
    
    await expect(loginPage.passwordError).toBeVisible();
    const passwordErrorText = await loginPage.passwordError.textContent();
    expect(passwordErrorText).toBe('Password must contain at least one lowercase letter, one uppercase letter, and one number');
  });

  test('should validate required fields', async () => {
    await loginPage.goto();
    await loginPage.expectEmptyFieldError();
  });

  test('should validate email format', async () => {
    await loginPage.goto();
    await loginPage.expectInvalidEmailError();
  });

  test('should navigate to forgot password page', async () => {
    await loginPage.goToForgotPassword();
  });

  test('should preserve form data after failed login attempt', async () => {
    const testEmail = 'test@example.com';
    const testPassword = 'wrongpass';

    await loginPage.emailInput.fill(testEmail);
    await loginPage.passwordInput.fill(testPassword);
    await loginPage.submitButton.click();

    // Verify form values are preserved
    await expect(loginPage.emailInput).toHaveValue(testEmail);
    await expect(loginPage.passwordInput).toHaveValue(testPassword);
  });

  test('should successfully login and redirect to generate page', async () => {
    await loginPage.emailInput.fill(TEST_USER.email);
    await loginPage.passwordInput.fill(TEST_USER.password);
    await loginPage.submitButton.click();

    // Wait for successful redirect
    await expect(loginPage.page).toHaveURL('/generate', { timeout: 10000 });
  });
}); 