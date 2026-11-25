import { defineConfig } from 'vitest/config'

// Firestore のルールと保存の層のテスト。エミュレーターは npm run test:firestore が立てる
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
