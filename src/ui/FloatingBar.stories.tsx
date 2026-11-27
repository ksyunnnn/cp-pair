import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { RESPONSIVE_VIEWPORT_VALUE } from "storybook/viewport";
import { Button, FloatingBar } from "./components.tsx";

// 操作の層。決まりは DESIGN.md の Components にある。ここには書き写さない
// Framer の部品シート「07 操作の層 / Liquid Glass」と同じく、iPhone の幅の画面の下に浮かべ、背後に内容を通して透け方を見る
const meta = {
  title: "部品/操作/FloatingBar",
  parameters: { layout: "fullscreen" },
  // 2 つの画面を横に並べるため、幅を iPhone に絞らない
  globals: { viewport: { value: RESPONSIVE_VIEWPORT_VALUE, isRotated: false } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/* 390 × 330 の画面。transform で、画面の下に固定する操作バーをこの枠の中に留める */
function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="sb-device-wrap">
      <figcaption className="t-label">{label}</figcaption>
      <div className="sb-device sb-device--short">
        <div className="cp-stack sb-glass-behind">
          <p className="t-title">ダミーの見出し</p>
          <p className="t-body c-muted">ダミーの補足</p>
          <div className="sb-block sb-block--ink" />
          <div className="sb-block" />
          <div className="sb-block sb-block--ink" />
        </div>
        {children}
      </div>
    </figure>
  );
}

/* 補足の文字あり・なし。ボタンは押したまま指を動かして確かめる */
export const States: Story = {
  name: "FloatingBar",
  render: () => (
    <div className="sb-devices">
      <Sample label="補足の文字あり">
        <FloatingBar note="ダミーの補足">
          <Button kind="primary">ダミーの主ボタン</Button>
          <Button kind="secondary">ダミーの副ボタン</Button>
        </FloatingBar>
      </Sample>
      <Sample label="補足の文字なし">
        <FloatingBar>
          <Button kind="primary">ダミーの主ボタン</Button>
        </FloatingBar>
      </Sample>
    </div>
  ),
};
