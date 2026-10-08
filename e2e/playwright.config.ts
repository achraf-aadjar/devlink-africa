import { defineConfig, devices } from '@playwright/test'

/**
 * Parcours de démonstration rejoué dans Chromium (voir docs/demo.md).
 *
 * Playwright démarre lui-même le backend (base SQLite jetable, données de
 * démonstration) et le serveur Vite, qui relaie /api vers le backend.
 * `PW_CHROMIUM_PATH` permet d'utiliser un Chromium déjà installé au lieu de
 * celui que télécharge `playwright install`.
 */
const executablePath = process.env.PW_CHROMIUM_PATH

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: [
    {
      command: '../scripts/e2e_backend.sh',
      url: 'http://localhost:8000/api/v1/health/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'npm --prefix ../frontend run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
