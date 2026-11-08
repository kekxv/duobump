import { defineConfig, devices } from '@playwright/test';
const base = process.env.BASE_PATH || '/';
const port = Number(process.env.E2E_PORT || 4321);
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: `http://127.0.0.1:${port}${base}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.E2E_COMMAND || `npm run preview -- --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
