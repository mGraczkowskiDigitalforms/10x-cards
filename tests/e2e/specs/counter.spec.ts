import { test, expect } from '@playwright/test';
import { CounterPage } from '../page-objects/counter.page';

test.describe('Example Counter Page', () => {
  let counterPage: CounterPage;

  test.beforeEach(async ({ page }) => {
    counterPage = new CounterPage(page);
    await counterPage.goto();
  });

  test.describe('Page Structure', () => {
    test('should have correct title and heading', async () => {
      await counterPage.expectPageTitle('Example Counter');
      await counterPage.expectMainHeading('Example Counter Page');
    });

    test('should meet accessibility requirements', async () => {
      await counterPage.expectAccessibility();
    });
  });

  test.describe('Counter Functionality', () => {
    test('should display initial count of zero', async () => {
      await counterPage.expectCount(0);
      await counterPage.expectButtonsEnabled();
    });

    test('should increment count', async () => {
      await counterPage.increment();
      await counterPage.expectCount(1);

      await counterPage.increment();
      await counterPage.expectCount(2);
    });

    test('should decrement count', async () => {
      // First increment to have a positive number
      await counterPage.increment();
      await counterPage.increment();
      await counterPage.expectCount(2);

      // Then decrement
      await counterPage.decrement();
      await counterPage.expectCount(1);
    });

    test('should handle multiple operations', async () => {
      await counterPage.increment();
      await counterPage.increment();
      await counterPage.decrement();
      await counterPage.increment();
      await counterPage.expectCount(2);
    });
  });

  test('should take screenshot on initial load', async ({ page }) => {
    await expect(page).toHaveScreenshot('counter-initial.png');
  });
}); 