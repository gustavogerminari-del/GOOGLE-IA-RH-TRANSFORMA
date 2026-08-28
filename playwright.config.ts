import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'artifacts/e2e/results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'artifacts/e2e/report', open: 'never' }],
    ['json', { outputFile: 'artifacts/e2e/results.json' }],
  ],
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    screenshot: 'on',
    trace: 'on',
    video: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 4173',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
