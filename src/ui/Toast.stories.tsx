import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { Button } from "./components.tsx";
import { useToast, type ToastKind } from "./toast.tsx";

// トースト。ToastProvider は .storybook/preview.tsx が全 story に置いている。決まりは DESIGN.md にある
const meta = { title: "部品/操作/Toast" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const KINDS: { kind: ToastKind; message: string }[] = [
  { kind: "success", message: "ダミーの完了の知らせ" },
  { kind: "info", message: "ダミーのお知らせ" },
  { kind: "warn", message: "ダミーの注意" },
];

/* 開いたときに 1 つ出し、ボタンで 3 種類を出し直せる。同時に出るのは 2 つまで */
function Toasts({ first }: { first: ToastKind }) {
  const toast = useToast();
  useEffect(() => {
    const k = KINDS.find((x) => x.kind === first)!;
    toast(k.message, k.kind, 60_000);
  }, [toast, first]);
  return (
    // トーストは画面の上端に出るため、ボタンを下げて隠れないようにする
    <div className="sb-stack" style={{ paddingTop: 80 }}>
      {KINDS.map((k) => (
        <Button key={k.kind} kind="secondary" onClick={() => toast(k.message, k.kind)}>
          {k.kind} を出す
        </Button>
      ))}
    </div>
  );
}

export const Success: Story = { render: () => <Toasts first="success" /> };
export const Info: Story = { render: () => <Toasts first="info" /> };
export const Warn: Story = { render: () => <Toasts first="warn" /> };
