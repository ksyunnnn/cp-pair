// のぞき見防止の画面: ホストの端末を本人に渡してから、本人が押して進む。
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { BLINK_EVERY, FRAME } from "../../styles/motion.ts";
import { BrandHeader, Button, ScreenMain } from "../../ui/components.tsx";
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
  const blinking = useBlink();
  return (
    <div className="cp-page">
      <BrandHeader right="ホストの端末" />
      <ScreenMain className="cp-handoff">
        {/* 目だけが 3 秒に 1 回、2 コマでまばたきする（app.css の .cp-blink） */}
        <CpSymbol name="Secret" size={54} eyeClassName={`cp-blink${blinking ? " is-blinking" : ""}`} />
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
      </ScreenMain>
    </div>
  );
}

/* BLINK_EVERY 秒ごとに 2 コマだけ true になる。reduced motion では動かさない */
function useBlink() {
  const reduced = useReducedMotion();
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let off = 0;
    const id = window.setInterval(() => {
      setBlinking(true);
      off = window.setTimeout(() => setBlinking(false), FRAME * 2 * 1000);
    }, BLINK_EVERY * 1000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(off);
    };
  }, [reduced]);
  return blinking;
}
