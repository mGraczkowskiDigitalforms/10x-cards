import { type Page, type Locator, expect } from '@playwright/test';

export class FlashcardProposalPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private getFlashcardTestId(index: number) {
    return `flashcard-proposal-${index}`;
  }

  private getFlashcardItem(index: number) {
    const testId = this.getFlashcardTestId(index);
    return this.page.locator(`[data-test-id="${testId}"]`);
  }

  private getFlashcardLocators(index: number) {
    const testId = this.getFlashcardTestId(index);
    return {
      frontText: this.page.locator(`[data-test-id="${testId}-front"]`),
      backText: this.page.locator(`[data-test-id="${testId}-back"]`),
      editButton: this.page.locator(`[data-test-id="${testId}-edit"]`),
      acceptButton: this.page.locator(`[data-test-id="${testId}-accept"]`),
      rejectButton: this.page.locator(`[data-test-id="${testId}-reject"]`),
      frontInput: this.page.locator(`[data-test-id="${testId}-edit-front"]`),
      backInput: this.page.locator(`[data-test-id="${testId}-edit-back"]`),
      saveButton: this.page.locator(`[data-test-id="${testId}-save-edit"]`),
      cancelButton: this.page.locator(`[data-test-id="${testId}-cancel-edit"]`)
    };
  }

  async editFlashcard(index: number, front: string, back: string) {
    const locators = this.getFlashcardLocators(index);
    await locators.editButton.click();
    await locators.frontInput.fill(front);
    await locators.backInput.fill(back);
    await locators.saveButton.click();
  }

  async acceptFlashcard(index: number) {
    const locators = this.getFlashcardLocators(index);
    await locators.acceptButton.click();
  }

  async rejectFlashcard(index: number) {
    const locators = this.getFlashcardLocators(index);
    await locators.rejectButton.click();
  }

  async expectFlashcardContent(index: number, front: string, back: string) {
    const locators = this.getFlashcardLocators(index);
    await expect(locators.frontText).toContainText(front);
    await expect(locators.backText).toContainText(back);
  }

  async expectFlashcardState(index: number, state: 'accepted' | 'rejected' | 'editable') {
    const locators = this.getFlashcardLocators(index);
    const item = this.getFlashcardItem(index);
    
    switch (state) {
      case 'accepted':
        await expect(locators.acceptButton).toBeDisabled();
        await expect(locators.editButton).not.toBeVisible();
        await expect(item).toHaveClass(/border-green-500/);
        break;
      case 'rejected':
        await expect(locators.rejectButton).toBeDisabled();
        await expect(locators.editButton).not.toBeVisible();
        await expect(item).toHaveClass(/border-red-500/);
        break;
      case 'editable':
        await expect(locators.acceptButton).toBeEnabled();
        await expect(locators.rejectButton).toBeEnabled();
        await expect(locators.editButton).toBeVisible();
        break;
    }
  }

  async expectEditMode(index: number, isEditing: boolean) {
    const item = this.getFlashcardItem(index);
    await expect(item).toHaveAttribute('data-edit-mode', isEditing.toString());
  }

  async startEditingAndVerifyConcurrentState(index: number) {
    const locators = this.getFlashcardLocators(index);
    await locators.editButton.click();
    await expect(locators.frontInput).toBeVisible();
    await expect(locators.backInput).toBeVisible();
    await expect(locators.saveButton).toBeVisible();
    await expect(locators.cancelButton).toBeVisible();
    await this.expectEditMode(index, true);
  }
} 