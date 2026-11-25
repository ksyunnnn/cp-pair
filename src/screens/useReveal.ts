// 結果の発表の段取り: ため（記号の差し替え）→ 相性度の数え上げ → 最終値で止める → 称号の判 → 名前と理念 → ほかの区画。
// 時刻は 12fps のコマで進める。画面を押すかキーを押すと、最後の状態へ飛ぶ（HIG Motion「Let people cancel motion」
// https://developer.apple.com/design/human-interface-guidelines/motion ）。
// 同じ結果の発表は 1 回だけ見せる。開き直したときは最後の状態から出す。reduced motion では段取りを省き、全体を opacity で一度に出す。
import { useReducedMotion, type MotionProps, type Transition, type Variants } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { FADE, FRAME, OFFSET, REVEAL, SPRING, easeOutCubic } from "../styles/motion.ts";

const revealed = new Set<string>();

export type RevealStage = "hold" | "count" | "seal" | "settle" | "done";

const VARIANTS: Record<"appear" | "seal" | "settle", Variants> = {
  appear: { off: { opacity: 0 }, on: { opacity: 1 } },
  seal: {
    off: { opacity: 0, scale: OFFSET.sealScale, rotate: OFFSET.sealRotate },
    on: { opacity: 1, scale: 1, rotate: 0 },
  },
  settle: { off: { opacity: 0, y: OFFSET.settleY }, on: { opacity: 1, y: 0 } },
};

const INSTANT: Transition = { duration: 0 };

export interface Reveal {
  /** 段取りの途中か */
  running: boolean;
  stage: RevealStage;
  /** ための間に差し替える記号の番号（0 が最後に残る記号） */
  glyph: number;
  /** 今見せる相性度 */
  score: number;
  /** ほかの区画（.r-later）の出し方。CSS が読む。off は隠す、on は opacity で出す、instant はすぐ出す。見せ終えた結果では undefined */
  later: "off" | "on" | "instant" | undefined;
  /** 部品に渡す Motion の props。appear は数字、seal は称号、settle は名前と理念（index で上からずらす） */
  part: (kind: "appear" | "seal" | "settle", index?: number) => MotionProps;
  skip: () => void;
}

export function useReveal(key: string, finalScore: number | null, glyphCount: number): Reveal {
  const reduced = useReducedMotion() ?? false;
  const [seen] = useState(() => revealed.has(key));
  const [start] = useState(() => performance.now());
  const [elapsed, setElapsed] = useState(() => (seen || reduced ? Infinity : 0));
  const [skipped, setSkipped] = useState(false);

  const countTime = finalScore === null ? 0 : REVEAL.count;
  const countHold = finalScore === null ? 0 : REVEAL.countHold;
  const tCount = REVEAL.hold;
  const tSeal = tCount + countTime + countHold;
  const tSettle = tSeal + REVEAL.afterSeal;
  const tDone = tSettle + REVEAL.stagger * 2;

  useEffect(() => {
    revealed.add(key);
  }, [key]);

  const running = elapsed !== Infinity;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const t = (performance.now() - start) / 1000;
      setElapsed(t >= tDone ? Infinity : t);
    }, FRAME * 1000);
    return () => window.clearInterval(id);
  }, [running, start, tDone]);

  const skip = useCallback(() => {
    setSkipped(true);
    setElapsed(Infinity);
  }, []);

  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, skip]);

  const t = elapsed;
  const stage: RevealStage =
    t < tCount ? "hold" : t < tSeal ? "count" : t < tSettle ? "seal" : running ? "settle" : "done";

  // 数え上げ: コマの頭の時刻で量子化してから減速の曲線にかける
  let score = finalScore ?? 0;
  if (finalScore !== null && t < tCount + countTime) {
    const frames = Math.floor(Math.max(0, t - tCount) / FRAME);
    score = Math.round(finalScore * easeOutCubic(Math.min(1, (frames * FRAME) / countTime)));
  }

  const glyph = stage === "hold" ? Math.floor(t / REVEAL.glyphEvery) % glyphCount : 0;

  const on = (kind: "appear" | "seal" | "settle") =>
    kind === "appear" ? stage !== "hold" : kind === "seal" ? t >= tSeal : t >= tSettle;

  const transitionFor = (kind: "appear" | "seal" | "settle", index: number): Transition => {
    if (skipped) return INSTANT;
    if (reduced) return { opacity: FADE.reveal };
    if (kind === "appear") return INSTANT;
    // 判は一瞬で現れて、弾んで 0° で止まる
    if (kind === "seal") return { default: SPRING.seal, opacity: INSTANT };
    const delay = index * REVEAL.stagger;
    return { y: { ...SPRING.settle, delay }, opacity: { ...FADE.quick, delay } };
  };

  const part = (kind: "appear" | "seal" | "settle", index = 0): MotionProps => ({
    variants: VARIANTS[kind],
    initial: seen ? false : "off",
    animate: on(kind) ? "on" : "off",
    transition: transitionFor(kind, index),
  });

  const later = seen ? undefined : skipped ? "instant" : t >= tSettle ? "on" : "off";

  return { running, stage, glyph, score, later, part, skip };
}
