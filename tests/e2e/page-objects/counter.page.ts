import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class CounterPage extends BasePage {
  // UI Elements
  readonly countDisplay: Locator;
  readonly incrementButton: Locator;
  readonly decrementButton: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.countDisplay = page.getByTestId('count-display');
    this.incrementButton = page.getByTestId('increment-button');
    this.decrementButton = page.getByTestId('decrement-button');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async goto() {
    await this.page.goto('/example');
  }

  async getCurrentCount(): Promise<number> {
    const text = await this.countDisplay.textContent();
    return text ? parseInt(text.replace('Count: ', '')) : 0;
  }

  async increment() {
    await this.incrementButton.click();
  }

  async decrement() {
    await this.decrementButton.click();
  }

  async expectCount(expected: number) {
    await expect(this.countDisplay).toHaveText(`Count: ${expected}`);
  }

  async expectButtonsEnabled() {
    await expect(this.incrementButton).toBeEnabled();
    await expect(this.decrementButton).toBeEnabled();
  }

  async expectPageTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectMainHeading(text: string) {
    await expect(this.heading).toHaveText(text);
  }

  async expectAccessibility() {
    // Check if buttons have proper roles and states
    await expect(this.incrementButton).toHaveAttribute('role', 'button');
    await expect(this.decrementButton).toHaveAttribute('role', 'button');

    // Check if counter display is readable
    await expect(this.countDisplay).toBeVisible();
    
    // Check if the page follows heading hierarchy
    await expect(this.heading).toBeVisible();
    
    // Take accessibility snapshot
    await expect(this.page).toHaveScreenshot('counter-accessibility.png');
  }
} 