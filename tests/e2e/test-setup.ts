import { test as base, expect } from '@playwright/test';
import type { Page, Request, Response, Route, ConsoleMessage } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FlashcardProposalPage } from './pages/FlashcardProposalPage';

// Common test data
export const TEST_USER = {
  email: 'mariusz@test.pl',
  password: 'Test1234%'
};

export const API_ENDPOINTS = {
  GENERATIONS: '/api/generations',
  FLASHCARDS: '/api/flashcards',
  FLASHCARDS_GENERATE: '/api/flashcards/generate'
};

// Mock data factory
export const createMockFlashcards = (count: number = 3) => ({
  generation: {
    id: 1,
    user_id: '30b7e765-9127-4446-bbb7-73369d365634',
    source_text_hash: 'abc123',
    text_length: 1000,
    flashcards_count: count,
    generation_duration: 1000,
    model: 'gpt-4',
    created_at: new Date().toISOString()
  },
  flashcards_proposal: Array(count).fill(null).map((_, i) => ({
    front: `Front ${i + 1}`,
    back: `Back ${i + 1}`,
    source: 'ai-full'
  }))
});

// Test validation constants
export const TEXT_VALIDATION = {
  MIN_LENGTH: 1000,
  MAX_LENGTH: 10000
};

// Extended test fixture
type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  flashcardProposalPage: FlashcardProposalPage;
};

export { expect };
export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  flashcardProposalPage: async ({ page }, use) => {
    const flashcardProposalPage = new FlashcardProposalPage(page);
    await use(flashcardProposalPage);
  }
});

// Common setup function
export async function setupTestEnvironment(page: Page) {
  // Setup console logging
  page.on('console', (msg: ConsoleMessage) => console.log(`Browser console: ${msg.text()}`));
  page.on('pageerror', (err: Error) => console.error(`Browser error: ${err}`));

  // Setup API mocks
  await page.route(API_ENDPOINTS.GENERATIONS, async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ 
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(createMockFlashcards())
      });
    }
  });

  await page.route(API_ENDPOINTS.FLASHCARDS, async (route: Route) => {
    if (route.request().method() === 'POST') {
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

  // Setup network request logging
  page.on('request', (request: Request) => {
    if (Object.values(API_ENDPOINTS).some(endpoint => request.url().includes(endpoint))) {
      console.log(`Request to ${request.url()}: ${request.method()}`);
    }
  });

  page.on('response', async (response: Response) => {
    if (Object.values(API_ENDPOINTS).some(endpoint => response.url().includes(endpoint))) {
      console.log(`Response from ${response.url()}: ${response.status()}`);
      if (!response.ok()) {
        const body = await response.json();
        console.log('Response body:', body);
      }
    }
  });
}

// Common test expectations
export async function expectPageToBeReady(page: Page) {
  await expect(page).toHaveURL('/generate', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-test-id="dashboard-view"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-test-id="user-email"]')).toBeVisible({ timeout: 10000 });
} 