import type { StorybookConfig } from "@storybook/react-vite";

// 部品とレイアウトの一覧（issue #42）。vite.config.ts をそのまま読み、本体と同じ変換で描く
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.tsx"],
  // 本体の PWA（Service Worker）は一覧には要らない。残すと一覧の配信先に本体の Service Worker ができる
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    // Phosphor は記号の story を開いたときに初めて見つかり、Vite が依存を変換し直す。その間に古い版を返して
    // 「Failed to fetch dynamically imported module」（504 Outdated Optimize Dep）になるため、起動のときに変換しておく
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [...(viteConfig.optimizeDeps?.include ?? []), "@phosphor-icons/react"],
    },
    plugins: viteConfig.plugins
      ?.flat()
      .filter((p) => !(p && typeof p === "object" && "name" in p && p.name.startsWith("vite-plugin-pwa"))),
  }),
};

export default config;
