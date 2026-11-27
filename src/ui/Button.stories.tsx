import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, FloatingBar } from "./components.tsx";

// 決まりは DESIGN.md の Components にある。ここには書き写さない
const meta = {
  title: "部品/Button",
  component: Button,
  args: { children: "はじめる" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { kind: "primary" } };
export const Secondary: Story = { args: { kind: "secondary" } };
export const Link: Story = { args: { kind: "link" } };
export const WithIcon: Story = { args: { kind: "primary", icon: "Pair" } };
export const Disabled: Story = { args: { kind: "primary", disabled: true } };

/* ガラスの上（FloatingBar の中）では押し方が変わる。押したまま指を動かして確かめる */
export const OnGlass: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <FloatingBar note="ガラスの上の補足">
      <Button {...args} kind="primary" />
      <Button {...args} kind="secondary" />
    </FloatingBar>
  ),
};
