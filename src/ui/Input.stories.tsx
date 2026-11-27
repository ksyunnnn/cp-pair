import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { Gender } from "../game/types.ts";
import { ChoiceCard, GenderSelect, NicknameInput } from "./components.tsx";

// 入力の部品。決まりは DESIGN.md の Components にある。ここには書き写さない
const meta = { title: "部品/入力" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Nickname({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return <NicknameInput value={value} onChange={setValue} />;
}

function GenderPicker({ initial }: { initial: Gender | null }) {
  const [value, setValue] = useState(initial);
  return <GenderSelect value={value} onChange={setValue} />;
}

/* 3 つ目は長い企業理念。省略せずに折り返す（Framer の部品シート「04 共通の選択肢カード」の「長い企業理念」） */
const LONG_LABEL =
  "ダミーの長い企業理念。創造と革新で、人と社会と地球に貢献し、すべてのいのちが調和するこころ豊かな未来をめざします。";

function Choices() {
  const [selected, setSelected] = useState(1);
  return (
    <>
      {["価値観", "働き方", "企業理念"].map((category, i) => (
        <ChoiceCard
          key={category}
          category={category}
          label={i === 2 ? LONG_LABEL : `ダミーの選択肢 ${i + 1}`}
          selected={selected === i}
          onClick={() => setSelected(i)}
        />
      ))}
    </>
  );
}

/* 空・入力済み。押して入力できる */
export const NicknameInputStates: Story = {
  name: "NicknameInput",
  render: () => (
    <div className="sb-stack">
      <Nickname initial="" />
      <Nickname initial="アオイ" />
    </div>
  ),
};

/* 未選択・選択済み。矢印キーでも選び替えられる */
export const GenderSelectStates: Story = {
  name: "GenderSelect",
  render: () => (
    <div className="sb-stack">
      <GenderPicker initial={null} />
      <GenderPicker initial="F" />
    </div>
  ),
};

/* 選んでいない・選んだ（押印の動き）。押して選び替える */
export const ChoiceCardStates: Story = {
  name: "ChoiceCard",
  render: () => (
    <div className="sb-stack">
      <Choices />
    </div>
  ),
};
