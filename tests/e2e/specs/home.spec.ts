import { test } from '@playwright/test';
import { HomePage } from '../page-objects/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test.describe('Page Structure', () => {
    test('should have correct title and heading', async () => {
      await homePage.expectPageTitle('10x Cards - Learn Faster with AI');
      await homePage.expectMainHeading('Learn Faster with AI-Powered Flashcards');
    });

    test('should have main navigation', async () => {
      await homePage.expectMainNavigation();
    });

    test('should have main content area', async () => {
      await homePage.expectMainContent();
    });

    test('should have footer', async () => {
      await homePage.expectFooter();
    });
  });

  test.describe('Accessibility', () => {
    test('should meet accessibility requirements', async () => {
      await homePage.expectAccessibility();
    });
  });
}); 