import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, ParticipantRow, ProgressSteps } from "./components.tsx";

// 表示の部品。決まりは DESIGN.md の Components にある。ここには書き写さない
const meta = { title: "部品/表示" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

export const BadgeStates: Story = {
  name: "Badge",
  render: () => (
    <div className="sb-row">
      <Badge>3 人</Badge>
      <Badge>ダミーのバッジ</Badge>
    </div>
  ),
};

/* 未完了・完了・操作ボタンあり・削除だけ・後から加わった行（上から打ち込む） */
export const ParticipantRowStates: Story = {
  name: "ParticipantRow",
  render: () => (
    <div className="sb-stack">
      <ParticipantRow name="アオイ" gender="F" joinType="device" status="選択中" done={false} />
      <ParticipantRow name="ハルト" gender="M" joinType="device" status="完了" done />
      <ParticipantRow
        name="ユイ"
        gender="F"
        joinType="manual"
        status="未選択"
        done={false}
        action="選ぶ"
        onAction={noop}
        onRemove={noop}
      />
      <ParticipantRow name="ソウタ" gender="M" joinType="manual" status="完了" done onRemove={noop} />
      <ParticipantRow name="リン" gender="F" joinType="device" status="選択中" done={false} entering />
    </div>
  ),
};

export const ProgressStepsStates: Story = {
  name: "ProgressSteps",
  render: () => (
    <div className="sb-stack">
      <ProgressSteps current={1} />
      <ProgressSteps current={2} />
      <ProgressSteps current={3} />
    </div>
  ),
};
