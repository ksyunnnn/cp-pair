import type { Meta, StoryObj } from "@storybook/react-vite";
import { CpSymbol, PairLogo, type SymbolName } from "./symbols.tsx";

// 記号とロゴ。決まりは DESIGN.md にある。ここには書き写さない
const meta = { title: "記号" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const NAMES: SymbolName[] = ["Pair", "Person", "Secret", "Talk", "Spark", "Done", "Swap", "Remove"];

/* 8 つの記号を 3 つの大きさで。目のある記号（Pair・Person・Secret・Talk）は目の色も見る */
export const CpSymbolAll: Story = {
  name: "CpSymbol",
  render: () => (
    <div className="sb-stack">
      {[14, 28, 56].map((size) => (
        <div key={size} className="sb-row">
          {NAMES.map((name) => (
            <figure key={name} className="sb-figure">
              <CpSymbol name={name} size={size} />
              {size === 56 && <figcaption className="t-small c-muted">{name}</figcaption>}
            </figure>
          ))}
        </div>
      ))}
    </div>
  ),
};

/* 色を反転した面の上（主ボタンやトーストで使う組み合わせ） */
export const CpSymbolInverse: Story = {
  name: "CpSymbol（反転した面の上）",
  render: () => (
    <div className="sb-row sb-inverse">
      {NAMES.map((name) => (
        <CpSymbol key={name} name={name} size={28} color="var(--text-inverse)" eyeColor="var(--surface-inverse)" />
      ))}
    </div>
  ),
};

export const PairLogoSizes: Story = {
  name: "PairLogo",
  render: () => (
    <div className="sb-row">
      <PairLogo width={30} />
      <PairLogo width={60} />
      <PairLogo width={120} />
    </div>
  ),
};
