// Framer の記号のセット「CP PAIR Symbols」（VectorSetNode qVkSETKBD）と、ロゴ「PAIR・ふたつの視線」（SVGNode ryVq3MygI）。
// tree.toSVG で取り出したパスをそのまま使う。書き出しに付いた stroke="#AAA" は取り除いた。
import type { CSSProperties } from "react";

export type SymbolName = "Pair" | "Person" | "Secret" | "Talk" | "Spark" | "Done" | "Swap" | "Remove";

const BODY: Record<SymbolName, string[]> = {
  Pair: [
    "M 4 23 C 4 9 12 2 21 2 C 30 2 36 10 36 23 C 36 36 29 42 20 42 C 11 42 4 36 4 23 Z",
    "M 29 23 C 29 9 37 2 46 2 C 55 2 61 10 61 23 C 61 36 54 42 45 42 C 36 42 29 36 29 23 Z",
  ],
  Person: [
    "M 20 15 C 20 7 25 3 32 3 C 39 3 44 7 44 15 C 44 23 39 27 32 27 C 25 27 20 23 20 15 Z",
    "M 9 53 C 9 38 17 31 32 31 C 47 31 55 38 55 53 L 55 58 L 9 58 Z",
  ],
  Secret: ["M 15 28 L 15 20 C 15 1 49 1 49 20 L 49 28 L 54 28 L 54 59 L 10 59 L 10 28 Z"],
  Talk: ["M 5 9 L 59 9 L 59 45 L 30 45 L 15 58 L 15 45 L 5 45 Z"],
  Spark: ["M 32 2 L 40 24 L 62 32 L 40 40 L 32 62 L 24 40 L 2 32 L 24 24 Z"],
  Done: ["M 4 32 L 14 22 L 27 35 L 51 10 L 61 20 L 27 55 Z"],
  Swap: [
    "M 7 14 L 42 14 L 42 4 L 60 22 L 42 40 L 42 30 L 7 30 Z",
    "M 57 50 L 22 50 L 22 60 L 4 42 L 22 24 L 22 34 L 57 34 Z",
  ],
  Remove: [
    "M 12 7 L 32 27 L 52 7 L 59 14 L 39 34 L 59 54 L 52 61 L 32 41 L 12 61 L 5 54 L 25 34 L 5 14 Z",
  ],
};

const EYES: Partial<Record<SymbolName, string[]>> = {
  Pair: [
    "M 21.5 14 C 22.881 14 24 16.239 24 19 C 24 21.761 22.881 24 21.5 24 C 20.119 24 19 21.761 19 19 C 19 16.239 20.119 14 21.5 14 Z",
    "M 42.5 14 C 43.881 14 45 16.239 45 19 C 45 21.761 43.881 24 42.5 24 C 41.119 24 40 21.761 40 19 C 40 16.239 41.119 14 42.5 14 Z",
  ],
  Person: [
    "M 26.5 11 C 27.881 11 29 13.239 29 16 C 29 18.761 27.881 21 26.5 21 C 25.119 21 24 18.761 24 16 C 24 13.239 25.119 11 26.5 11 Z",
    "M 38.5 11 C 39.881 11 41 13.239 41 16 C 41 18.761 39.881 21 38.5 21 C 37.119 21 36 18.761 36 16 C 36 13.239 37.119 11 38.5 11 Z",
  ],
  Secret: [
    "M 26.5 37 C 27.881 37 29 39.239 29 42 C 29 44.761 27.881 47 26.5 47 C 25.119 47 24 44.761 24 42 C 24 39.239 25.119 37 26.5 37 Z",
    "M 38.5 37 C 39.881 37 41 39.239 41 42 C 41 44.761 39.881 47 38.5 47 C 37.119 47 36 44.761 36 42 C 36 39.239 37.119 37 38.5 37 Z",
  ],
  Talk: [
    "M 26.5 22 C 27.881 22 29 24.239 29 27 C 29 29.761 27.881 32 26.5 32 C 25.119 32 24 29.761 24 27 C 24 24.239 25.119 22 26.5 22 Z",
    "M 38.5 22 C 39.881 22 41 24.239 41 27 C 41 29.761 39.881 32 38.5 32 C 37.119 32 36 29.761 36 27 C 36 24.239 37.119 22 38.5 22 Z",
  ],
};

export function CpSymbol({
  name,
  size = 16,
  color = "var(--cp-ink)",
  eyeColor = "var(--cp-paper)",
  style,
  className,
  eyeClassName,
}: {
  name: SymbolName;
  size?: number;
  color?: string;
  eyeColor?: string;
  style?: CSSProperties;
  className?: string;
  /** 目のパスに付けるクラス（まばたきに使う） */
  eyeClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {BODY[name].map((d) => (
        <path key={d} d={d} fill={color} />
      ))}
      {(EYES[name] || []).map((d) => (
        <path key={d} d={d} fill={eyeColor} className={eyeClassName} />
      ))}
    </svg>
  );
}

/** ロゴ「PAIR・ふたつの視線」。viewBox 64×44。Framer の枠は幅 30 に高さ 20.4（比 0.68）。 */
export function PairLogo({ width = 30 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 64 44"
      width={width}
      height={width * 0.68}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M4 23C4 9 12 2 21 2s15 8 15 21-7 19-16 19S4 36 4 23Z" fill="var(--cp-ink)" />
      <path d="M29 23C29 9 37 2 46 2s15 8 15 21-7 19-16 19-16-6-16-19Z" fill="var(--cp-ink)" />
      <rect x="19" y="14" width="5" height="14" rx="2.5" fill="var(--cp-paper)" />
      <rect x="40" y="14" width="5" height="14" rx="2.5" fill="var(--cp-paper)" />
    </svg>
  );
}
