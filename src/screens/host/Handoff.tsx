// のぞき見防止の画面: ホストの端末を本人に渡してから、本人が押して進む。
import { BrandHeader, Button } from "../../ui/components.tsx";
import { CpSymbol } from "../../ui/symbols.tsx";

export function Handoff({
  name,
  purpose,
  lead,
  onProceed,
  onBack,
}: {
  name: string;
  purpose: string;
  lead: string;
  onProceed: () => void;
  onBack: () => void;
}) {
  return (
    <div className="cp-page">
      <BrandHeader right="ホストの端末" />
      <main className="cp-handoff">
        <CpSymbol name="Secret" size={54} />
        <div className="cp-stack cp-stack--8">
          <p className="t-label c-muted">ホストの端末を渡してください</p>
          <div className="cp-handoff__name">
            <h1 className="t-name">{name}</h1>
            <span className="t-strong">{purpose}</span>
          </div>
          <p className="t-body c-muted">{lead}</p>
        </div>
        <div className="cp-stack cp-stack--8">
          <Button onClick={onProceed}>私は{name}です</Button>
          <Button kind="link" onClick={onBack}>
            ホスト画面に戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
