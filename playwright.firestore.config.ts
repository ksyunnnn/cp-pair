import { defineConfig, devices } from '@playwright/test'

// Firestore 版（VITE_ROOM_STORE=firestore）をビルドし、手元の Firebase エミュレーターにつないで確かめる。
// 実行は npm run test:e2e:firestore（firebase emulators:exec が Auth と Firestore のエミュレーターを立ててから動かす）
// https://playwright.dev/docs/test-webserver
const port = 4175
const outDir = 'dist-e2e-firestore'

export default defineConfig({
  testDir: './e2e-firestore',
  outputDir: './test-results',
  use: {
    baseURL: `http://localhost:${port}`,
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
    // Service Worker の保存はこのテストの対象でない。保存した版が応答して、エミュレーターとの通信が見えなくならないようにする
    serviceWorkers: 'block',
  },
  webServer: {
    command: `npx tsc -b && npx vite build --outDir ${outDir} && npx vite preview --outDir ${outDir} --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_ROOM_STORE: 'firestore',
      VITE_USE_FIREBASE_EMULATOR: 'true',
      // エミュレーターだけで動かす demo プロジェクト（.firebaserc）。ほかの値は空でない仮の値でよい
      VITE_FIREBASE_PROJECT_ID: 'demo-cp-pair',
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-cp-pair.firebaseapp.com',
      VITE_FIREBASE_APP_ID: 'demo-app-id',
    },
  },
})
