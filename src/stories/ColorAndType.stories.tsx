import type { Meta, StoryObj } from "@storybook/react-vite";

// 色と文字の見本。値の原本は src/styles/tokens.css で、決まりは DESIGN.md にある。ここには値を書き写さない
// Framer の部品シート「01 色と文字」にあたる。色は Framer の名前で並べ、部品が使う用途の名前を添える
const meta = { title: "色と文字" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/* Framer の色トークン 6 つと、部品が使う用途の名前（tokens.css の「色の用途」） */
const COLORS = [
  { framer: "CP paper", role: "--surface" },
  { framer: "CP ink", role: "--text" },
  { framer: "CP muted", role: "--text-muted", note: "文字の 4.5:1 を満たすよう明度を下げた" },
  { framer: "CP line", role: "--border" },
  { framer: "CP accent", role: "--accent", note: "大きい文字と印だけ。小さい文字は --text-accent" },
  { framer: "CP soft", role: "--surface-sunken" },
] as const;

/* Framer の文字スタイル 6 つ（TextStylePresetNode） */
const TYPES = [
  { className: "t-title", label: "見出し" },
  { className: "t-phrase", label: "大きな一言" },
  { className: "t-section", label: "節の見出し" },
  { className: "t-body", label: "本文" },
  { className: "t-label", label: "ラベル" },
  { className: "t-small", label: "補足" },
] as const;

export const Colors: Story = {
  name: "色",
  render: () => (
    <div className="sb-stack">
      {COLORS.map((c) => (
        <figure key={c.role} className="sb-swatch">
          <div className="sb-swatch__chip" style={{ background: `var(${c.role})` }} />
          <figcaption>
            <p className="t-label">{c.framer}</p>
            <p className="t-small c-muted">
              {c.role}
              {"note" in c && `（${c.note}）`}
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const Type: Story = {
  name: "文字",
  render: () => (
    <div className="sb-stack">
      {TYPES.map((t) => (
        <figure key={t.className} className="sb-figure sb-type">
          <p className={t.className}>真顔のまま、ちょっとだけ変。</p>
          <figcaption className="t-small c-muted">
            {t.label}（.{t.className}）
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};
