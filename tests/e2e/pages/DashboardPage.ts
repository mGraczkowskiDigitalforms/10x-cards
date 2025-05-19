import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly userEmail: Locator;
  readonly userLastLogin: Locator;
  readonly generateForm: Locator;
  readonly generateTextInput: Locator;
  readonly generateButton: Locator;
  readonly characterCount: Locator;
  readonly flashcardList: Locator;
  readonly saveAllButton: Locator;
  readonly saveAcceptedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userEmail = page.locator('[data-test-id="user-email"]');
    this.userLastLogin = page.locator('[data-test-id="user-last-login"]');
    this.generateForm = page.locator('[data-test-id="generate-form"]');
    this.generateTextInput = page.locator('[data-test-id="generate-text-input"]');
    this.generateButton = page.locator('[data-test-id="generate-submit-button"]');
    this.characterCount = page.locator('[data-test-id="character-count"]');
    this.flashcardList = page.locator('[data-test-id="flashcard-proposal-list"]');
    this.saveAllButton = page.locator('[data-test-id="save-all-button"]');
    this.saveAcceptedButton = page.locator('[data-test-id="save-accepted-button"]');
  }

  async expectLoggedInUser(email: string) {
    await expect(this.userEmail).toContainText(email);
  }

  async fillGenerateText(text: string) {
    await this.generateTextInput.fill(text);
    // Wait for character count to update
    await expect(this.characterCount).toContainText(`Characters: ${text.length}`);
  }

  async generateFlashcards() {
    // Create a promise for the response before clicking
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes('/api/generations')
    );

    // Click the button
    await this.generateButton.click();

    // Wait for the response
    const response = await responsePromise;

    if (response.status() === 201) {
      // Wait for flashcard list to appear with longer timeout
      await expect(this.flashcardList).toBeVisible({ timeout: 10000 });
    }

    return response;
  }

  async getFlashcardCount() {
    const stats = await this.page.locator('[data-test-id="flashcard-stats"]').textContent();
    const match = stats?.match(/(\d+) of (\d+)/);
    return match ? { accepted: parseInt(match[1]), total: parseInt(match[2]) } : { accepted: 0, total: 0 };
  }
} 