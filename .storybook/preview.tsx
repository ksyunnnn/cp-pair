import type { Preview } from "@storybook/react-vite";
import { LazyMotion, MotionConfig } from "motion/react";
import { INITIAL_VIEWPORTS } from "storybook/viewport";

// 本体の起動（src/main.tsx と src/App.tsx）と同じものを読み込む。ずれると一覧の見た目が本体と変わる
import "@fontsource/zen-kaku-gothic-new/500.css";
import "@fontsource/zen-kaku-gothic-new/700.css";
import "@fontsource/zen-kaku-gothic-new/900.css";
import "@fontsource/anton/400.css";
import "@fontsource/inter/700.css";

import "../src/styles/index.css";
import "./preview.css";
import { applyMotionVars } from "../src/styles/motion.ts";
import loadMotionFeatures from "../src/ui/motionFeatures.ts";
import { ToastProvider } from "../src/ui/toast.tsx";

applyMotionVars();

const preview: Preview = {
  // 遊ぶ端末の幅で開く。広い幅では部品が伸び、画面の下に固定する部品（操作バー・トースト）の位置も実機とずれる。
  // 上のツールバーの端末の印から、ほかの幅に切り替えられる
  parameters: { viewport: { options: INITIAL_VIEWPORTS } },
  initialGlobals: { viewport: { value: "iphone14", isRotated: false } },
  decorators: [
    (Story) => (
      <MotionConfig reducedMotion="user">
        <LazyMotion features={loadMotionFeatures} strict>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </LazyMotion>
      </MotionConfig>
    ),
  ],
};

export default preview;
