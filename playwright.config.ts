import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Ensure required environment variables are set
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_KEY: process.env.SUPABASE_KEY || 'dummy-key',
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'cleanup db',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      teardown: 'cleanup db',
    },
  ],

  webServer: {
    command: 'npm run dev:e2e',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_KEY: process.env.SUPABASE_KEY!,
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID!,
      E2E_USERNAME: process.env.E2E_USERNAME!,
      E2E_PASSWORD: process.env.E2E_PASSWORD!,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
      OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL!,
      OPENROUTER_REFERER: process.env.OPENROUTER_REFERER!,
    },
  },
}); 