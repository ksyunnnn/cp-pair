import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Button } from "../ui/components.tsx";
import { CpSymbol } from "../ui/symbols.tsx";

// レイアウトの基本形（Every Layout https://every-layout.dev/layouts/ ）。中身はダミー。
// 本体にあるクラスはそれを使い、本体にない Cluster と Frame だけ .storybook/preview.css の sb-l-* で示す。
// 余白と並べ方の決まりは DESIGN.md の Layout にある。ここには書き写さない
const meta = { title: "レイアウト/基本形" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const Block = ({ children }: { children: string }) => <div className="sb-block t-small">{children}</div>;

/* 縦に積み、間を揃える。本体の .cp-stack（12px）と .cp-stack--8・--16、画面の本文の .cp-content（--block-gap） */
export const Stack: Story = {
  render: () => (
    <div className="sb-stack">
      {(["cp-stack cp-stack--8", "cp-stack", "cp-stack cp-stack--16"] as const).map((c) => (
        <div key={c} className={c}>
          <p className="t-small c-muted">.{c.split(" ").at(-1)}</p>
          <Block>ダミー 1</Block>
          <Block>ダミー 2</Block>
        </div>
      ))}
    </div>
  ),
};

/* 枠と内側の余白で囲む。本体の .cp-card・.cp-card--soft・.cp-card--ink */
export const Box: Story = {
  render: () => (
    <div className="sb-stack">
      <div className="cp-card">
        <p className="t-section">.cp-card</p>
        <p className="t-body">ダミーの本文</p>
      </div>
      <div className="cp-card cp-card--soft">
        <p className="t-small c-muted">.cp-card--soft</p>
        <p className="t-section">ダミーの本文</p>
      </div>
      <div className="cp-card cp-card--ink">
        <p className="t-section">.cp-card--ink</p>
        <p className="t-body">ダミーの本文</p>
      </div>
    </div>
  ),
};

/* 幅に上限を付けて中央に置く。本体の .cp-page（--page-max）。広い幅で見ると中央に寄る */
export const Center: Story = {
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "ipad", isRotated: false } },
  render: () => (
    <div className="cp-page sb-outline">
      <div className="cp-content">
        <p className="t-small c-muted">.cp-page の中の .cp-content</p>
        <Block>ダミーの本文</Block>
      </div>
    </div>
  ),
};

/* 折り返す横並び。本体に共通のクラスはなく、部品ごとに書いている（.cp-row__attrs など）。ここでは sb-l-cluster で示す */
export const Cluster: Story = {
  render: () => (
    <div className="sb-l-cluster">
      {["ダミー", "折り返す", "横並び", "の", "見本", "バッジ"].map((t) => (
        <Badge key={t}>{t}</Badge>
      ))}
    </div>
  ),
};

/* 画面の高さを満たし、主役を真ん中、端の要素を上下に置く。本体の .cp-page（高さ 100dvh 以上）と .cp-footer（margin-top: auto） */
export const Cover: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="cp-page">
      <div className="cp-content">
        <p className="t-small c-muted">上の要素</p>
      </div>
      <div className="sb-l-cover__principal">
        <CpSymbol name="Pair" size={64} />
        <p className="t-title">主役のダミー</p>
      </div>
      <footer className="cp-footer">
        <Button kind="link">下の要素（.cp-footer）</Button>
      </footer>
    </div>
  ),
};

/* 縦横の比を固定して切り抜く。本体に共通のクラスはない。ここでは sb-l-frame で示す（16:9・1:1） */
export const Frame: Story = {
  render: () => (
    <div className="sb-stack">
      <div className="sb-l-frame" style={{ aspectRatio: "16 / 9" }}>
        <span className="t-small">16:9</span>
      </div>
      <div className="sb-l-frame" style={{ aspectRatio: "1 / 1", width: 160 }}>
        <span className="t-small">1:1</span>
      </div>
    </div>
  ),
};
