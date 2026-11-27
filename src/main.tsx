import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// 書体は同梱する（ネットのない会場でも表示が変わらないように）
import "@fontsource/zen-kaku-gothic-new/500.css";
import "@fontsource/zen-kaku-gothic-new/700.css";
import "@fontsource/zen-kaku-gothic-new/900.css";
import "@fontsource/anton/400.css";
import "@fontsource/inter/700.css";

import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/result.css";
import App from "./App.tsx";
import { applyMotionVars } from "./styles/motion.ts";

// CSS で使う動きの時間を、motion.ts から :root に書き込む（値の原本は motion.ts だけにする）
applyMotionVars();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
