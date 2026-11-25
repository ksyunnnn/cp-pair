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
    // 既定の版（localStorage 版）を確かめる。手元の .env.local に Firestore 版の設定があっても、ここの値が勝つ
    // （Vite は実行時の環境変数を .env で上書きしない https://vite.dev/guide/env-and-mode ）
    env: {
      VITE_ROOM_STORE: 'local',
      VITE_USE_FIREBASE_EMULATOR: 'false',
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_STORAGE_BUCKET: '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '',
      VITE_FIREBASE_APP_ID: '',
    },
  },
})
