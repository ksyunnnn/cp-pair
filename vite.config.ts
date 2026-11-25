import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 電波の届かない場所で遊ぶため、一度開いた後はネットワークなしで起動できるようにする。
    // ビルドした全ファイルを Service Worker が先に保存し、画面の遷移は index.html で返す。
    // 新しい版は、オンラインで開いたときに取得して入れ替える（autoUpdate）
    // https://vite-pwa-org.netlify.app/guide/
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // 書体は woff2 だけを保存する。@fontsource の CSS は woff2 を先に挙げ、
        // Safari を含む対象のブラウザは woff2 を読むため、woff は取りに行かない
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'CP PAIR',
        short_name: 'CP PAIR',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#F4F2EB',
        theme_color: '#F4F2EB',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})
