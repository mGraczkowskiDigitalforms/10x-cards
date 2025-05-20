import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FlashcardProposalPage } from './pages/FlashcardProposalPage';

test.describe('Flashcard Management', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let flashcardProposalPage: FlashcardProposalPage;

  // Test data from .env.test
  const TEST_USER = {
    email: 'mariusz@test.pl',
    password: 'Test1234%'
  };

  // Mock data for flashcard generation
  const MOCK_FLASHCARDS = {
    generation: {
      id: 1,
      user_id: '30b7e765-9127-4446-bbb7-73369d365634',
      source_text_hash: 'abc123',
      text_length: 1000,
      flashcards_count: 5,
      generation_duration: 1000,
      model: 'gpt-4',
      created_at: new Date().toISOString()
    },
    flashcards_proposal: Array(5).fill(null).map((_, i) => ({
      front: `Front ${i + 1}`,
      back: `Back ${i + 1}`,
      source: 'ai-full'
    }))
  };

  const VALID_TEXT = 'a'.repeat(1000);
  const TOO_SHORT_TEXT = 'a'.repeat(999);
  const TOO_LONG_TEXT = 'a'.repeat(10001);

  test.beforeEach(async ({ page }) => {
    // Listen to console logs
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => console.error(`Browser error: ${err}`));

    // Mock the generations API endpoint
    await page.route('/api/generations', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        console.log('Mocking /api/generations response');
        await route.fulfill({ 
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_FLASHCARDS)
        });
      }
    });

    // Mock the flashcards save endpoint
    await page.route('/api/flashcards', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        console.log('Mocking /api/flashcards response');
        await route.fulfill({ 
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            flashcards: [],
            message: 'Flashcards creation completed'
          })
        });
      }
    });

    // Listen to network requests
    page.on('request', request => {
      if (request.url().includes('/api/generations') || request.url().includes('/api/flashcards')) {
        console.log(`Request to ${request.url()}: ${request.method()}`);
      }
    });
    page.on('response', async response => {
      if (response.url().includes('/api/generations') || response.url().includes('/api/flashcards')) {
        console.log(`Response from ${response.url()}: ${response.status()}`);
        if (!response.ok()) {
          const body = await response.json();
          console.log('Response body:', body);
        }
      }
    });

    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    flashcardProposalPage = new FlashcardProposalPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    
    // Wait for redirect to generate page
    await expect(page).toHaveURL('/generate', { timeout: 10000 });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard is loaded with user info
    await expect(page.locator('[data-test-id="dashboard-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-test-id="user-email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should save all generated flashcards', async ({ page }) => {
    // Create a promise for the generations response
    const generationsPromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    await dashboardPage.fillGenerateText(VALID_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the generations response
    await generationsPromise;

    // Create a promise for the flashcards response
    const flashcardsPromise = page.waitForResponse(response => 
      response.url().includes('/api/flashcards') && 
      response.status() === 201
    );

    // Save flashcards
    await dashboardPage.saveAllButton.click();

    // Wait for the response and verify it
    const response = await flashcardsPromise;
    const responseData = await response.json();
    expect(responseData.message).toBe('Flashcards creation completed');
  });

  test('should save only accepted flashcards', async ({ page }) => {
    // Create a promise for the generations response
    const generationsPromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    await dashboardPage.fillGenerateText(VALID_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the generations response
    await generationsPromise;

    // Accept only first 3 flashcards
    await flashcardProposalPage.acceptFlashcard(0);
    await flashcardProposalPage.acceptFlashcard(1);
    await flashcardProposalPage.acceptFlashcard(2);

    // Create a promise for the flashcards response
    const flashcardsPromise = page.waitForResponse(response => 
      response.url().includes('/api/flashcards') && 
      response.status() === 201
    );

    // Save flashcards
    await dashboardPage.saveAllButton.click();

    // Wait for the response and verify it
    const response = await flashcardsPromise;
    const responseData = await response.json();
    expect(responseData.message).toBe('Flashcards creation completed');
  });

  test('should reject all flashcards', async ({ page }) => {
    // Create a promise for the generations response
    const generationsPromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    await dashboardPage.fillGenerateText(VALID_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the generations response
    await generationsPromise;

    // Reject all flashcards
    for (let i = 0; i < 5; i++) {
      await flashcardProposalPage.rejectFlashcard(i);
    }

    // Verify save accepted button is disabled since no flashcards are accepted
    await expect(dashboardPage.saveAcceptedButton).toBeDisabled();
  });

  test('should handle duplicate flashcards error', async ({ page }) => {
    // Override the default mock for this test
    await page.route('/api/flashcards', route => 
      route.fulfill({ 
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'DUPLICATE_FLASHCARDS',
          message: 'These flashcards already exist'
        })
      })
    );

    // Create a promise for the generations response
    const generationsPromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    await dashboardPage.fillGenerateText(VALID_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the generations response
    await generationsPromise;

    // Create a promise for the flashcards response
    const flashcardsPromise = page.waitForResponse(response => 
      response.url().includes('/api/flashcards') && 
      response.status() === 400
    );

    // Save flashcards
    await dashboardPage.saveAllButton.click();

    // Wait for the response and verify it
    const response = await flashcardsPromise;
    const responseData = await response.json();
    expect(responseData.error).toBe('DUPLICATE_FLASHCARDS');
    expect(responseData.message).toBe('These flashcards already exist');
  });

  test('should validate minimum text length', async ({ page }) => {
    await dashboardPage.fillGenerateText(TOO_SHORT_TEXT);
    
    // Verify error message and disabled generate button
    await expect(dashboardPage.generateButton).toBeDisabled();
    await expect(page.locator('[data-test-id="characters-needed"]')).toBeVisible();
  });

  test('should validate maximum text length', async ({ page }) => {
    await dashboardPage.fillGenerateText(TOO_LONG_TEXT);
    
    // Verify error message and disabled generate button
    await expect(dashboardPage.generateButton).toBeDisabled();
    await expect(page.locator('[data-test-id="generate-error-alert"]')).toContainText('Text cannot be longer than 10000 characters');
  });
}); 