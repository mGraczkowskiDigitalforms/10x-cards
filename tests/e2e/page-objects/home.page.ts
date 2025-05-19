import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  // Navigation elements
  readonly mainNav: Locator;
  readonly mainContent: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    super(page);
    this.mainNav = page.getByRole('navigation', { name: 'main' });
    this.mainContent = page.getByRole('main');
    this.footer = page.getByRole('contentinfo');
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectPageTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectMainHeading(text: string) {
    const heading = this.page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(text);
    // Check if it's the first heading on the page
    await expect(this.page.getByRole('heading')).toHaveCount(1);
  }

  async expectMainNavigation() {
    await expect(this.mainNav).toBeVisible();
    // Check if navigation has proper ARIA role
    await expect(this.mainNav).toHaveAttribute('aria-label', 'main');
  }

  async expectMainContent() {
    await expect(this.mainContent).toBeVisible();
    // Check if main content has proper ARIA role
    await expect(this.mainContent).toHaveAttribute('role', 'main');
  }

  async expectFooter() {
    await expect(this.footer).toBeVisible();
  }

  async expectAccessibility() {
    // Check for basic accessibility requirements
    await expect(this.page.getByRole('banner')).toBeVisible();
    await expect(this.mainNav).toBeVisible();
    await expect(this.mainContent).toBeVisible();
    await expect(this.footer).toBeVisible();

    // Take accessibility snapshot
    await expect(this.page).toHaveScreenshot('home-page-accessibility.png');
  }
} 