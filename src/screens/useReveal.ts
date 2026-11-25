// 結果の発表の段取り: ため（見出しだけが画面の中央で、記号を差し替える）→ 見出しが元の位置へ上がる →
// 相性度だけが中央で数え上げ、最終値で止めて称号の判 → 相性度が元の位置へ下がる → 名前を打つ → 理念とほかの区画。
// 動く部品は transform（y）だけで中央から元の位置へ移し、隠す部品は opacity 0 で場所を取ったままにする。最後の配置は静止の配置と同じ。
// 時刻は 12fps のコマで進める。画面を押すかキーを押すと、最後の状態へ飛ぶ（HIG Motion「Let people cancel motion」
// https://developer.apple.com/design/human-interface-guidelines/motion ）。
// 同じ結果の発表は 1 回だけ見せる。開き直したときは最後の状態から出す。reduced motion では段取りを省き、全体を opacity で一度に出す。
import {
  animate,
  useMotionValue,
  useReducedMotion,
  type MotionProps,
  type MotionValue,
  type Transition,
  type Variants,
} from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { FADE, FRAME, OFFSET, REVEAL, SPRING, STAMP, easeOutCubic } from "../styles/motion.ts";

const revealed = new Set<string>();

export type RevealStage = "hold" | "rise" | "count" | "seal" | "drop" | "settle" | "done";

type PartKind = "appear" | "seal" | "strike" | "settle";
type TravelKind = "eyebrow" | "score";

const VARIANTS: Record<PartKind, Variants> = {
  appear: { off: { opacity: 0 }, on: { opacity: 1 } },
  // 判: 元の大きさで現れ、持ち上げて止め、元より少し下まで打ち込んで収める（STAMP.seal の times に合わせた 5 点）
  seal: {
    off: { opacity: 0, scale: 1, rotate: 0, y: 0 },
    on: {
      opacity: 1,
      scale: [1, OFFSET.sealScale, OFFSET.sealScale, OFFSET.sealStrikeScale, 1],
      rotate: [0, OFFSET.sealRotate, OFFSET.sealRotate, 0, 0],
      y: [0, OFFSET.sealY, OFFSET.sealY, OFFSET.sealStrikeY, 0],
    },
  },
  // 名前: 大きく現れ、元より少し小さく打ち込んで収める（STAMP.name の times に合わせた 3 点）
  strike: {
    off: { opacity: 0, scale: 1 },
    on: { opacity: 1, scale: [OFFSET.nameScale, OFFSET.nameStrikeScale, 1] },
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
  /** 部品に渡す Motion の props。appear は数字、seal は称号、strike は名前、settle は理念（index で上からずらす） */
  part: (kind: PartKind, index?: number) => MotionProps;
  /** 画面の中央から元の位置へ移る部品（見出し・相性度）に渡す ref と style */
  travel: (kind: TravelKind) => { ref: RefObject<HTMLDivElement | null>; style: { y: MotionValue<number> } };
  skip: () => void;
}

/** 元の位置から画面の中央までの縦の距離（px）。transform を外した配置で測る */
function offsetToCenter(el: HTMLElement | null): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  return window.innerHeight / 2 - (r.top + r.height / 2);
}

export function useReveal(key: string, finalScore: number | null, glyphCount: number): Reveal {
  const reduced = useReducedMotion() ?? false;
  const [seen] = useState(() => revealed.has(key));
  const [start] = useState(() => performance.now());
  const [elapsed, setElapsed] = useState(() => (seen || reduced ? Infinity : 0));
  const [skipped, setSkipped] = useState(false);

  const hasScore = finalScore !== null;
  const tRise = REVEAL.hold;
  const tCount = tRise + REVEAL.rise;
  const tSeal = tCount + (hasScore ? REVEAL.count + REVEAL.countHold : 0);
  const tDrop = tSeal + REVEAL.seal + (hasScore ? REVEAL.sealHold : 0);
  const tName = tDrop + (hasScore ? REVEAL.drop : 0);
  const tDone = tName + REVEAL.stagger * 2;

  const eyebrowRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const eyebrowY = useMotionValue(0);
  const scoreY = useMotionValue(0);

  useEffect(() => {
    revealed.add(key);
  }, [key]);

  const running = elapsed !== Infinity;

  // 描く前に、ページを先頭へ戻してから中央までの距離を測り、見出しと相性度を中央へ置く
  const [initialRunning] = useState(running);
  useLayoutEffect(() => {
    if (!initialRunning) return;
    window.scrollTo(0, 0);
    eyebrowY.jump(offsetToCenter(eyebrowRef.current));
    scoreY.jump(offsetToCenter(scoreRef.current));
  }, [initialRunning, eyebrowY, scoreY]);

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
  const rising = t >= tRise;
  const dropping = t >= tDrop;

  // 見出しと相性度を元の位置へ移す。飛ばしたときと終えたときは、その場で元の位置に置く
  useEffect(() => {
    if (skipped || !running) {
      eyebrowY.jump(0);
      return;
    }
    if (rising) animate(eyebrowY, 0, SPRING.travel);
  }, [rising, running, skipped, eyebrowY]);
  useEffect(() => {
    if (skipped || !running) {
      scoreY.jump(0);
      return;
    }
    if (dropping) animate(scoreY, 0, SPRING.travel);
  }, [dropping, running, skipped, scoreY]);

  const stage: RevealStage =
    t < tRise
      ? "hold"
      : t < tCount
        ? "rise"
        : t < tSeal
          ? "count"
          : t < tDrop
            ? "seal"
            : t < tName
              ? "drop"
              : running
                ? "settle"
                : "done";

  // 数え上げ: コマの頭の時刻で量子化してから減速の曲線にかける
  let score = finalScore ?? 0;
  if (finalScore !== null && t < tCount + REVEAL.count) {
    const frames = Math.floor(Math.max(0, t - tCount) / FRAME);
    score = Math.round(finalScore * easeOutCubic(Math.min(1, (frames * FRAME) / REVEAL.count)));
  }

  // 記号は名前を打つまで差し替え続ける
  const glyph = t < tName ? Math.floor(t / REVEAL.glyphEvery) % glyphCount : 0;

  const on = (kind: PartKind) =>
    kind === "appear" ? t >= tCount : kind === "seal" ? t >= tSeal : t >= tName;

  const transitionFor = (kind: PartKind, index: number): Transition => {
    if (skipped) return INSTANT;
    if (reduced) return { opacity: FADE.reveal };
    if (kind === "appear") return INSTANT;
    // 判は一瞬で現れて、ため・止め・打ち・収めの順に動き、0° で止まる
    if (kind === "seal") return { default: STAMP.seal, opacity: INSTANT };
    if (kind === "strike") return { default: STAMP.name, opacity: INSTANT };
    const delay = index * REVEAL.stagger;
    return { y: { ...SPRING.settle, delay }, opacity: { ...FADE.quick, delay } };
  };

  const part = (kind: PartKind, index = 0): MotionProps => ({
    variants: VARIANTS[kind],
    initial: seen ? false : "off",
    animate: on(kind) ? "on" : "off",
    transition: transitionFor(kind, index),
  });

  const travel = (kind: TravelKind) =>
    kind === "eyebrow" ? { ref: eyebrowRef, style: { y: eyebrowY } } : { ref: scoreRef, style: { y: scoreY } };

  const later = seen ? undefined : skipped ? "instant" : t >= tName ? "on" : "off";

  return { running, stage, glyph, score, later, part, travel, skip };
}
