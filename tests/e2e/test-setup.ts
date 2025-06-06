import { test as base, expect } from "@playwright/test";
import type { Page, Request, Response, Route, ConsoleMessage } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FlashcardProposalPage } from "./pages/FlashcardProposalPage";

// Common test data
export const TEST_USER = {
  email: "test@test.pl",
  password: "qibquB-gecka3-muwhyb",
};

export const API_ENDPOINTS = {
  GENERATIONS: "/api/generations",
  FLASHCARDS: "/api/flashcards",
  FLASHCARDS_GENERATE: "/api/flashcards/generate",
};

// Mock data factory
export const createMockFlashcards = (count = 3) => ({
  generation: {
    id: 1,
    user_id: "30b7e765-9127-4446-bbb7-73369d365634",
    source_text_hash: "abc123",
    text_length: 1000,
    flashcards_count: count,
    generation_duration: 1000,
    model: "gpt-4",
    created_at: new Date().toISOString(),
  },
  flashcards_proposal: Array(count)
    .fill(null)
    .map((_, i) => ({
      front: `Front ${i + 1}`,
      back: `Back ${i + 1}`,
      source: "ai-full",
    })),
});

// Test validation constants
export const TEXT_VALIDATION = {
  MIN_LENGTH: 1000,
  MAX_LENGTH: 10000,
};

// Extended test fixture
interface TestFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  flashcardProposalPage: FlashcardProposalPage;
}

export { expect };
export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, utilizePage) => {
    const loginPage = new LoginPage(page);
    await utilizePage(loginPage);
  },
  dashboardPage: async ({ page }, utilizePage) => {
    const dashboardPage = new DashboardPage(page);
    await utilizePage(dashboardPage);
  },
  flashcardProposalPage: async ({ page }, utilizePage) => {
    const flashcardProposalPage = new FlashcardProposalPage(page);
    await utilizePage(flashcardProposalPage);
  },
});

// Common setup function
export async function setupTestEnvironment(page: Page) {
  // Setup console logging
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.text().includes("Login error") || msg.text().includes("Failed to load resource")) {
      console.log(`Authentication error: ${msg.text()}`);
    } else {
      console.log(`Browser console: ${msg.text()}`);
    }
  });
  page.on("pageerror", (err: Error) => {
    console.error("Browser error:", err);
    console.error("Stack trace:", err.stack);
  });

  // Setup API mocks
  await page.route(API_ENDPOINTS.GENERATIONS, async (route: Route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(createMockFlashcards()),
      });
    }
  });

  await page.route(API_ENDPOINTS.FLASHCARDS, async (route: Route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          flashcards: [],
          message: "Flashcards creation completed",
        }),
      });
    }
  });

  // Setup network request logging
  page.on("request", (request: Request) => {
    if (Object.values(API_ENDPOINTS).some((endpoint) => request.url().includes(endpoint))) {
      console.log(`Request to ${request.url()}: ${request.method()}`);
    }
  });

  page.on("response", async (response: Response) => {
    if (Object.values(API_ENDPOINTS).some((endpoint) => response.url().includes(endpoint))) {
      console.log(`Response from ${response.url()}: ${response.status()}`);
      if (!response.ok()) {
        const body = await response.json();
        console.log("Response body:", body);
      }
    }
  });
}

// Common test expectations
export async function expectPageToBeReady(page: Page) {
  // First wait for navigation to complete
  await page.waitForURL("/generate", { timeout: 60000 });

  // Then wait for the page to be fully loaded
  await page.waitForLoadState("networkidle", { timeout: 60000 });

  // Finally wait for key elements to be visible
  await Promise.all([
    page.locator('[data-test-id="dashboard-view"]').waitFor({ state: "visible", timeout: 60000 }),
    page.locator('[data-test-id="user-email"]').waitFor({ state: "visible", timeout: 60000 }),
  ]);
}
