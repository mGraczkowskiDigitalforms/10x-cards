import { expect } from "@playwright/test";
import { test, setupTestEnvironment, expectPageToBeReady, TEST_USER, TEXT_VALIDATION } from "./test-setup";

// Add type declarations
declare global {
  interface Window {
    toastMessages: { type: string; message: string }[];
    toast: {
      success: (message: string) => void;
      error: (message: string) => void;
    };
  }
}

test.describe("Flashcard Generation Validation", () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await setupTestEnvironment(page);

    // Initialize toast message collection
    await page.addInitScript(() => {
      window.toastMessages = [];
      window.toast = {
        success: (message) => window.toastMessages.push({ type: "success", message }),
        error: (message) => window.toastMessages.push({ type: "error", message }),
      };
    });

    // Login and verify page is ready
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await expectPageToBeReady(page);
  });

  test("should validate minimum text length", async ({ page, dashboardPage }) => {
    const shortText = "Too short text";
    await dashboardPage.fillGenerateText(shortText);
    await expect(dashboardPage.generateButton).toBeDisabled();
    await expect(page.locator('[data-test-id="characters-needed"]')).toContainText(
      `(Need ${TEXT_VALIDATION.MIN_LENGTH - shortText.length} more)`
    );
  });

  test("should validate maximum text length", async ({ page, dashboardPage }) => {
    const longText = "a".repeat(TEXT_VALIDATION.MAX_LENGTH + 1);
    await dashboardPage.fillGenerateText(longText);
    await expect(dashboardPage.generateButton).toBeDisabled();
    await expect(page.locator('[data-test-id="generate-error-alert"]')).toContainText(
      `Text cannot be longer than ${TEXT_VALIDATION.MAX_LENGTH} characters`
    );
  });

  test("should validate flashcard edit content", async ({ page, dashboardPage }) => {
    await page.goto("/generate");
    await page.waitForSelector("form");

    // Fill the generate text with longer content
    console.log("Filling generate text...");
    const longText = "A".repeat(1000) + " Test content for flashcard generation";
    await dashboardPage.fillGenerateText(longText);
    await dashboardPage.generateFlashcards();

    // Wait for the first flashcard to be visible
    console.log("Waiting for flashcard to be visible...");
    await page.waitForSelector('[data-test-id="flashcard-proposal-0"]');

    // Click edit button
    console.log("Starting edit mode...");
    await page.click('[data-test-id="flashcard-proposal-0-edit"]');

    // Empty front validation
    console.log("Testing empty front validation...");
    await page.fill('[data-test-id="flashcard-proposal-0-edit-front"]', "");
    await page.click('[data-test-id="flashcard-proposal-0-save-edit"]');

    // Verify edit mode is still active
    console.log("Verifying edit mode after empty front...");
    await expect(page.locator('[data-test-id="flashcard-proposal-0-edit-front"]')).toBeVisible();
    await expect(page.locator('[data-test-id="flashcard-proposal-0-edit-back"]')).toBeVisible();

    // Empty back validation
    console.log("Testing empty back validation...");
    await page.fill('[data-test-id="flashcard-proposal-0-edit-front"]', "Test Front");
    await page.fill('[data-test-id="flashcard-proposal-0-edit-back"]', "");
    await page.click('[data-test-id="flashcard-proposal-0-save-edit"]');

    // Verify edit mode is still active
    console.log("Verifying edit mode after empty back...");
    await expect(page.locator('[data-test-id="flashcard-proposal-0-edit-front"]')).toBeVisible();
    await expect(page.locator('[data-test-id="flashcard-proposal-0-edit-back"]')).toBeVisible();

    // Test valid content
    console.log("Testing valid content...");
    await page.fill('[data-test-id="flashcard-proposal-0-edit-front"]', "Updated Front");
    await page.fill('[data-test-id="flashcard-proposal-0-edit-back"]', "Updated Back");
    await page.click('[data-test-id="flashcard-proposal-0-save-edit"]');

    // Verify edit mode is closed
    console.log("Verifying edit mode is closed...");
    await expect(page.locator('[data-test-id="flashcard-proposal-0-edit-front"]')).not.toBeVisible();
    await expect(page.locator('[data-test-id="flashcard-proposal-0-edit-back"]')).not.toBeVisible();

    // Verify content was updated
    await expect(page.locator('[data-test-id="flashcard-proposal-0-front"]')).toHaveText("Updated Front");
    await expect(page.locator('[data-test-id="flashcard-proposal-0-back"]')).toHaveText("Updated Back");
  });

  test("should handle concurrent edits correctly", async ({ page, dashboardPage, flashcardProposalPage }) => {
    console.log("Starting concurrent edits test...");

    // Generate flashcards
    console.log("Generating flashcards...");
    const validText = "A".repeat(1000) + " Test content for flashcard generation";
    await dashboardPage.fillGenerateText(validText);
    await dashboardPage.generateFlashcards();

    // Wait for flashcards to be visible
    console.log("Waiting for flashcard to be visible...");
    await page.waitForSelector('[data-test-id="flashcard-proposal-0"]', { timeout: 10000 });

    // Verify concurrent edit state
    console.log("Starting edit mode and verifying concurrent state...");
    await flashcardProposalPage.startEditingAndVerifyConcurrentState(0);
  });
});
