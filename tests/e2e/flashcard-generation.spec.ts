import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FlashcardProposalPage } from './pages/FlashcardProposalPage';

// Add type declarations
declare global {
  interface Window {
    toastMessages: Array<{ type: string; message: string; }>;
    toast: {
      success: (message: string) => void;
      error: (message: string) => void;
    };
  }
}

test.describe('Flashcard Generation Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let flashcardProposalPage: FlashcardProposalPage;

  // Test data from .env.test
  const TEST_USER = {
    email: 'test@test.pl',
    password: 'qibquB-gecka3-muwhyb'
  };

  // Mock data for flashcard generation
  const MOCK_FLASHCARDS = {
    generation: {
      id: 1,
      user_id: '30b7e765-9127-4446-bbb7-73369d365634',
      source_text_hash: 'abc123',
      text_length: 1000,
      flashcards_count: 3,
      generation_duration: 1000,
      model: 'gpt-4',
      created_at: new Date().toISOString()
    },
    flashcards_proposal: [
      {
        front: "What is Lorem Ipsum?",
        back: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        source: 'ai-full'
      },
      {
        front: "When was Lorem Ipsum first used?",
        back: "Lorem Ipsum has been the industry's standard dummy text since the 1500s.",
        source: 'ai-full'
      },
      {
        front: "Why do we use Lorem Ipsum?",
        back: "It is used because it has a more-or-less normal distribution of letters.",
        source: 'ai-full'
      }
    ]
  };

  const SAMPLE_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`.repeat(2);

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

    // Listen to network requests for flashcard generation
    page.on('request', request => {
      if (request.url().includes('/api/generations')) {
        console.log(`Request to ${request.url()}: ${request.method()}`);
      }
    });
    page.on('response', async response => {
      if (response.url().includes('/api/generations')) {
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

  test('should show generate form with proper validation', async ({ page }) => {
    // Check if form elements are visible
    await expect(page.locator('[data-test-id="generate-form"]')).toBeVisible();
    await expect(page.locator('[data-test-id="generate-text-input"]')).toBeVisible();
    await expect(page.locator('[data-test-id="character-count"]')).toBeVisible();

    // Try to generate with too short text
    await dashboardPage.fillGenerateText('Too short text');
    await expect(page.locator('[data-test-id="characters-needed"]')).toBeVisible();
    await expect(dashboardPage.generateButton).toBeDisabled();

    // Fill with valid text
    await dashboardPage.fillGenerateText(SAMPLE_TEXT);
    await expect(dashboardPage.generateButton).toBeEnabled();
  });

  test('should generate and show flashcard proposals', async ({ page }) => {
    // Create a promise for the response before filling text
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    // Fill text and generate flashcards
    await dashboardPage.fillGenerateText(SAMPLE_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the response
    await responsePromise;

    // Wait for the list to be rendered
    await expect(page.locator('[data-test-id="flashcard-proposal-list"]')).toBeVisible({ timeout: 10000 });

    // Verify flashcards were generated
    const { total } = await dashboardPage.getFlashcardCount();
    expect(total).toBe(MOCK_FLASHCARDS.flashcards_proposal.length);

    // Check if first flashcard is visible and has correct content
    await expect(page.locator('[data-test-id="flashcard-proposal-0"]')).toBeVisible();
    await flashcardProposalPage.expectFlashcardContent(0, MOCK_FLASHCARDS.flashcards_proposal[0].front, MOCK_FLASHCARDS.flashcards_proposal[0].back);
  });

  test('should handle flashcard editing and state changes', async ({ page }) => {
    // Create a promise for the response before generating
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    // Generate flashcards first
    await dashboardPage.fillGenerateText(SAMPLE_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the response
    await responsePromise;

    // Edit first flashcard
    const newContent = {
      front: 'Custom front text',
      back: 'Custom back text'
    };
    await flashcardProposalPage.editFlashcard(0, newContent.front, newContent.back);
    
    // Verify edit
    await flashcardProposalPage.expectFlashcardContent(0, newContent.front, newContent.back);

    // Test state changes
    await flashcardProposalPage.acceptFlashcard(0);
    await flashcardProposalPage.expectFlashcardState(0, 'accepted');

    await flashcardProposalPage.rejectFlashcard(1);
    await flashcardProposalPage.expectFlashcardState(1, 'rejected');
  });

  test('should save accepted flashcards', async ({ page }) => {
    // Create a promise for the generations response before generating
    const generationsPromise = page.waitForResponse(response => 
      response.url().includes('/api/generations') && 
      response.status() === 201
    );

    // Generate and accept flashcards
    await dashboardPage.fillGenerateText(SAMPLE_TEXT);
    await dashboardPage.generateFlashcards();

    // Wait for the generations response
    await generationsPromise;

    const { total } = await dashboardPage.getFlashcardCount();
    expect(total).toBe(MOCK_FLASHCARDS.flashcards_proposal.length);
    
    // Accept first two flashcards
    await flashcardProposalPage.acceptFlashcard(0);
    await flashcardProposalPage.acceptFlashcard(1);

    // Create a promise for the flashcards response before clicking
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
}); 