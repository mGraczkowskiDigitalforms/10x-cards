import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

// Ensure required environment variables are set
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_KEY: process.env.SUPABASE_PUBLIC_KEY || 'dummy-key',
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  webServer: {
    command: `SUPABASE_URL=${requiredEnvVars.SUPABASE_URL} SUPABASE_KEY=${requiredEnvVars.SUPABASE_KEY} NODE_ENV=test npm run dev`,
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: requiredEnvVars.SUPABASE_URL,
      SUPABASE_KEY: requiredEnvVars.SUPABASE_KEY,
    },
  },
}); 