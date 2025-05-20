import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  // Test data from .env.test
  const TEST_USER = {
    email: process.env.E2E_USERNAME!,
    password: process.env.E2E_PASSWORD!
  };

  // Verify required environment variables
  if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
    throw new Error('Required environment variables E2E_USERNAME and E2E_PASSWORD must be set in .env.test');
  }

  // Log environment variables
  console.log('Environment variables:', {
    SUPABASE_URL: process.env.SUPABASE_URL,
    E2E_USERNAME: process.env.E2E_USERNAME,
    E2E_PASSWORD: process.env.E2E_PASSWORD
  });

  console.log('Test user credentials:', TEST_USER);

  test.beforeEach(async ({ page }) => {
    // Add request/response logging
    page.on('request', request => {
      if (request.url().includes('/auth')) {
        console.log(`Request to ${request.url()}: ${request.method()}`);
        console.log('Request headers:', request.headers());
        const postData = request.postData();
        if (postData) console.log('Request body:', postData);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/auth')) {
        console.log(`Response from ${response.url()}: ${response.status()}`);
        try {
          const body = await response.json();
          console.log('Response body:', body);
        } catch (e) {
          console.log('Failed to parse response body');
        }
      }
    });

    // Add console error logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });

    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    console.log('Starting login test with credentials:', { email: TEST_USER.email });
    
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    console.log('Login form submitted');
    
    // Wait for navigation
    try {
      await expect(page).toHaveURL('/generate', { timeout: 60000 });
      console.log('Successfully redirected to /generate');
    } catch (error) {
      console.log('Failed to redirect to /generate');
      console.log('Current URL:', page.url());
      throw error;
    }
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.login('wrong@email.com', 'WrongPass123!');
    await loginPage.expectErrorMessage('Invalid credentials');
    
    // Should stay on login page
    await expect(loginPage.page).toHaveURL('/auth/login');
  });

  test('should validate empty fields', async () => {
    await loginPage.submitButton.click();
    
    // Check email error
    await expect(loginPage.emailError).toBeVisible({ timeout: 60000 });
    await expect(loginPage.emailError).toContainText('Email is required');

    // Check password error
    await expect(loginPage.passwordError).toBeVisible({ timeout: 60000 });
    await expect(loginPage.passwordError).toContainText('Password is required');
  });
}); 