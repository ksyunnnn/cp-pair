import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrandHeader, Eyebrow, ScreenHeading, ScreenMain, Section, TopLinkFooter } from "./components.tsx";
import { CpSymbol } from "./symbols.tsx";

// 見出しと区切りの部品。決まりは DESIGN.md の Components にある。ここには書き写さない
const meta = { title: "部品/見出しと区切り" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const icon = <CpSymbol name="Spark" size={14} />;

/* 右の文字なし・右の文字あり・about へのリンクあり（トップ画面だけ） */
export const BrandHeaderStates: Story = {
  name: "BrandHeader",
  render: () => (
    <div className="sb-stack">
      <BrandHeader />
      <BrandHeader right="ダミーの右の文字" />
      <BrandHeader aboutLink />
    </div>
  ),
};

export const EyebrowStates: Story = {
  name: "Eyebrow",
  render: () => <Eyebrow icon={icon}>EYEBROW</Eyebrow>,
};

/* 補足なし・補足あり */
export const ScreenHeadingStates: Story = {
  name: "ScreenHeading",
  render: () => (
    <div className="sb-stack">
      <ScreenHeading eyebrow="STEP 1" icon={icon} title="ダミーの見出し" />
      <ScreenHeading eyebrow="STEP 2" icon={icon} title="ダミーの見出し" lead="ダミーの補足。二行になるくらいの長さの文を入れて、折り返しを確かめる。" />
    </div>
  ),
};

/* 見出しなし・見出しだけ・見出しと右の補足 */
export const SectionStates: Story = {
  name: "Section",
  render: () => (
    <div className="sb-stack">
      <Section>
        <p className="t-body">見出しのない区画</p>
      </Section>
      <Section title="ダミーの見出し">
        <p className="t-body">見出しだけの区画</p>
      </Section>
      <Section title="ダミーの見出し" aside="右の補足">
        <p className="t-body">見出しと右の補足がある区画</p>
      </Section>
    </div>
  ),
};

export const TopLinkFooterStates: Story = {
  name: "TopLinkFooter",
  render: () => <TopLinkFooter />,
};

/* 画面の本文。開くと下から打ち込んで止まる（左の一覧で選び直すと、もう一度動く） */
export const ScreenMainStates: Story = {
  name: "ScreenMain",
  parameters: { layout: "fullscreen" },
  render: () => (
    // 画面と同じ入れ子（src/screens/RulesScreen.tsx など）: cp-page の中に cp-content の本文
    <div className="cp-page">
      <ScreenMain className="cp-content">
        <ScreenHeading eyebrow="SCREEN" icon={icon} title="ダミーの画面" lead="本文が下から入る" />
      </ScreenMain>
    </div>
  ),
};
