import { defineConfig, devices } from '@playwright/test'

// ビルドした版を vite preview で配信して確かめる。Service Worker は本番と同じビルドでしか動かないため
// https://playwright.dev/docs/test-webserver
const port = 4174

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  use: {
    baseURL: `http://localhost:${port}`,
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
