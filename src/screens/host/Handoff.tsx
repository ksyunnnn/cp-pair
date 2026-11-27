// のぞき見防止の画面: ホストの端末を本人に渡してから、本人が押して進む。
import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef } from "react";
import { FRAME, NOD, TICK } from "../../styles/motion.ts";
import { BrandHeader, Button, ScreenMain } from "../../ui/components.tsx";
import { CpSymbol } from "../../ui/symbols.tsx";
import { HostDeviceLabel } from "./OfflineMode.tsx";

export function Handoff({
  roomId,
  name,
  purpose,
  lead,
  onProceed,
  onBack,
}: {
  roomId: string;
  name: string;
  purpose: string;
  lead: string;
  onProceed: () => void;
  onBack: () => void;
}) {
  const nodRef = useNod();
  return (
    <div className="cp-page">
      <BrandHeader right={<HostDeviceLabel roomId={roomId} />} homeLink={false} />
      <ScreenMain className="cp-handoff">
        {/* 記号だけが約 72 BPM でうなずき、4 拍に 1 回、止めの間に目が 2 コマでまばたきする（handoff.css の .cp-nod と .cp-blink） */}
        <span ref={nodRef} className="cp-nod">
          <CpSymbol name="Secret" size={54} eyeClassName="cp-blink" />
        </span>
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

/* 記号を拍ごとにうなずかせ、blinkEvery 拍ごとの止めの間に目へ is-blinking を付ける。
   React の再描画を起こさないよう、DOM に直接 animate する。reduced motion では動かさず、画面を離れたら止める */
function useNod() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const eyes = el.querySelectorAll(".cp-blink");
    const rest = NOD.beatTicks - NOD.duration / TICK;
    let stopped = false;
    let controls: AnimationPlaybackControls | undefined;
    const timers: number[] = [];
    const later = (fn: () => void, sec: number) => timers.push(window.setTimeout(fn, sec * 1000));
    const beat = (n: number) => {
      if (stopped) return;
      if (n % NOD.blinkEvery === NOD.blinkEvery - 1) {
        later(() => eyes.forEach((e) => e.classList.add("is-blinking")), TICK * NOD.ticks.windUp);
        later(() => eyes.forEach((e) => e.classList.remove("is-blinking")), TICK * NOD.ticks.windUp + FRAME * 2);
      }
      controls = animate(
        el,
        { rotate: [...NOD.rotate], y: [...NOD.y] },
        {
          duration: NOD.duration,
          times: [...NOD.times],
          ease: [...NOD.ease],
          onComplete: () => {
            const jitter = Math.floor(Math.random() * (NOD.jitterTicks * 2 + 1)) - NOD.jitterTicks;
            later(() => beat(n + 1), TICK * Math.max(0, rest + jitter));
          },
        },
      );
    };
    beat(0);
    return () => {
      stopped = true;
      controls?.stop();
      timers.forEach((t) => window.clearTimeout(t));
      eyes.forEach((e) => e.classList.remove("is-blinking"));
      el.style.transform = "";
    };
  }, [reduced]);
  return ref;
}
