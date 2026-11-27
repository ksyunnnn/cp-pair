import type { Preview } from "@storybook/react-vite";
import { LazyMotion, MotionConfig } from "motion/react";

// 本体の起動（src/main.tsx と src/App.tsx）と同じものを読み込む。ずれると一覧の見た目が本体と変わる
import "@fontsource/zen-kaku-gothic-new/500.css";
import "@fontsource/zen-kaku-gothic-new/700.css";
import "@fontsource/zen-kaku-gothic-new/900.css";
import "@fontsource/anton/400.css";
import "@fontsource/inter/700.css";

import "../src/styles/index.css";
import { applyMotionVars } from "../src/styles/motion.ts";
import loadMotionFeatures from "../src/ui/motionFeatures.ts";
import { ToastProvider } from "../src/ui/toast.tsx";

applyMotionVars();

const preview: Preview = {
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
