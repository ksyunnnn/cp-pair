// 動きの値（テーマ「判を押して、止まる」）。動きの時間・spring・easing はここだけに書く（CSS で使う時間は CSS_MOTION）。
// - 操作の層（ボタン・トースト）: Apple の spring。bounce は 0〜0.15（WWDC23 Animate with springs https://developer.apple.com/videos/play/wwdc2023/10158/ ）
// - コンテンツの層（画面・カード・結果）: 速く打って、着地したら止める。着地の後は動かさない
// - 記号の差し替え: 12fps のコマ打ち（LOVE DEATH + ROBOTS の title animation の「frames hold slightly too long」https://luckydumpling.github.io/motion-archive/entries/love-death-robots-title-animation/ ）
// - 時間は 24fps のコマ（TICK = 41.7ms）の倍数に揃える。12fps の 1 コマ（FRAME = 83ms）は 24fps の 2 コマ。
//   打つ動きは mcbess のループ（ベースを弾いてうなずく、24fps）を測って合わせた: 上げる 330ms（減速）→ 300ms 止める →
//   2 コマ（83ms）で落とす → 2 コマで収める。速い打ちを遅いためと止めの約 4 倍の速さにし、動くのは 1 か所だけにする。
//   ガラスの上のボタン（glass*）は iOS の実機に合わせた値なので揃えない
// reduced motion では MotionConfig reducedMotion="user" が transform を止め、opacity だけが残る（https://motion.dev/docs/react-accessibility ）
import type { Transition } from "motion/react";

/** 12fps の 1 コマ（秒） */
export const FRAME = 1 / 12;

/** 24fps の 1 コマ（秒、41.7ms）。時間はこの倍数に揃える */
export const TICK = 1 / 24;

export const SPRING = {
  /** ボタンを押した瞬間（縮む） */
  press: { type: "spring", visualDuration: TICK * 2, bounce: 0 },
  /** ボタンを離したとき（戻る） */
  release: { type: "spring", visualDuration: TICK * 7, bounce: 0.15 },
  /** 画面が入る */
  enter: { type: "spring", visualDuration: TICK * 8, bounce: 0 },
  /** 一覧に行が加わる */
  row: { type: "spring", visualDuration: TICK * 6, bounce: 0.1 },
  /** 結果の名前と理念が出る */
  settle: { type: "spring", visualDuration: TICK * 7, bounce: 0 },
  /** 結果の見出しと相性度が、画面の中央から元の位置へ移る。行き過ぎずに着地して止める */
  travel: { type: "spring", visualDuration: TICK * 7, bounce: 0 },
  /** ガラスの上のボタンを押した瞬間（膨らんで浮く）。gel のように少し行き過ぎる */
  glassPress: { type: "spring", visualDuration: 0.16, bounce: 0.3 },
  /** ガラスの上のボタンを押したまま指を動かしたとき（指へ寄って伸びる） */
  glassFollow: { type: "spring", visualDuration: 0.15, bounce: 0 },
  /** ガラスの上のボタンを離したとき（大きさ・位置が元に戻る） */
  glassRelease: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
  /** トーストが出る */
  toast: { type: "spring", visualDuration: TICK * 7, bounce: 0.15 },
} as const satisfies Record<string, Transition>;

export const FADE = {
  /** reduced motion のとき、動きの代わりに残す opacity */
  quick: { duration: TICK * 4, ease: "easeOut" },
  /** 結果の発表を reduced motion で一度に出す */
  reveal: { duration: TICK * 5, ease: "easeOut" },
  /** トーストが消える */
  out: { duration: TICK * 5, ease: "easeIn" },
} as const satisfies Record<string, Transition>;

/** 判を押す動きのコマ数（24fps）。ため → 止め → 打ち → 収め */
export const SEAL_TICKS = { windUp: 8, hold: 7, strike: 2, settle: 2 } as const;
const SEAL_TOTAL = SEAL_TICKS.windUp + SEAL_TICKS.hold + SEAL_TICKS.strike + SEAL_TICKS.settle;

/**
 * 判を押す動き（keyframes）。値は OFFSET の seal* / card* を順に通る。
 * seal: 結果の称号。元の大きさから持ち上げて止め、元より少し下まで打ち込んで収める（19 コマ = 792ms）
 * card: 選んだカード。よく押すのでためと止めを省き、打ちと収めだけにする（4 コマ = 167ms）
 * name: 結果の相手の名前。大きく現れて打ち込み、収める（4 コマ = 167ms）。発表の山なので、ためを挟まず一打で決める
 */
export const STAMP = {
  seal: {
    duration: TICK * SEAL_TOTAL,
    times: [
      0,
      SEAL_TICKS.windUp / SEAL_TOTAL,
      (SEAL_TICKS.windUp + SEAL_TICKS.hold) / SEAL_TOTAL,
      (SEAL_TICKS.windUp + SEAL_TICKS.hold + SEAL_TICKS.strike) / SEAL_TOTAL,
      1,
    ],
    ease: ["easeOut", "linear", "easeIn", "easeOut"],
  },
  card: {
    duration: TICK * 4,
    times: [0, 0.5, 1],
    ease: ["easeIn", "easeOut"],
  },
  name: {
    duration: TICK * 4,
    times: [0, 0.5, 1],
    ease: ["easeIn", "easeOut"],
  },
} as const satisfies Record<string, Transition>;

/**
 * うなずく動き（24fps のコマ数）。mcbess のループ（ベースを弾いてうなずく、約 72 BPM）の拍に合わせた。
 * 1 拍 = ため 8 → 止め 7 → 打ち 2 → 収め 2 → 休み。拍は beatTicks（20 コマ = 833ms）を中心に ±jitterTicks コマ揺らし、機械的にしない。
 * 動くのは頭（記号）だけ。回転の軸は記号の下端に置く（app.css の .cp-nod）。
 * rotate（deg）と y（px）は ため → 止め → 打ち込んだ底 → 元 を順に通る。まばたきは blinkEvery 拍に 1 回、止めの間に入れる
 */
const NOD_TICKS = SEAL_TICKS;
const NOD_MOVE = NOD_TICKS.windUp + NOD_TICKS.hold + NOD_TICKS.strike + NOD_TICKS.settle;
export const NOD = {
  ticks: NOD_TICKS,
  beatTicks: 20,
  jitterTicks: 1,
  rotate: [0, -10, -10, 2, 0],
  y: [0, -5, -5, 1.5, 0],
  /** ため〜収めの長さ（秒）。拍の残りは休み */
  duration: TICK * NOD_MOVE,
  times: [
    0,
    NOD_TICKS.windUp / NOD_MOVE,
    (NOD_TICKS.windUp + NOD_TICKS.hold) / NOD_MOVE,
    (NOD_TICKS.windUp + NOD_TICKS.hold + NOD_TICKS.strike) / NOD_MOVE,
    1,
  ],
  ease: ["easeOut", "linear", "easeIn", "easeOut"],
  blinkEvery: 4,
} as const;

/** 押したときの縮み */
export const PRESS_SCALE = 0.96;

/**
 * ガラスの上のボタンを押したときの動き（iOS 26.3 Safari の segmented control の thumb を見て合わせた）。
 * 押すと scale だけ膨らみ、押したまま動かすと指へ寄る。寄る量は指の移動 × follow を tanh で maxX / maxY に収める。
 * 動かした向きに stretch だけ伸ばし、直交する向きを squash だけ縮める
 */
export const GLASS_PRESS = {
  scale: 1.1,
  follow: 0.2,
  maxX: 6,
  maxY: 4,
  stretch: 0.06,
  squash: 0.03,
} as const;

/** 動き始めの距離（px）・大きさ・角度（deg）。どれも最後は元の位置・大きさ・0° に戻る */
export const OFFSET = {
  enterY: 12,
  rowY: -6,
  toastY: -8,
  toastScale: 0.98,
  settleY: 8,
  /** カード: 打ち始め → 打ち込んだ底 */
  cardScale: 1.03,
  cardRotate: -1.5,
  cardStrikeScale: 0.99,
  /** 称号: 持ち上げた頂点 → 打ち込んだ底 */
  sealScale: 1.12,
  sealRotate: -2,
  sealY: -6,
  sealStrikeScale: 0.985,
  sealStrikeY: 1,
  /** 名前: 現れたときの大きさ → 打ち込んだ底 */
  nameScale: 1.08,
  nameStrikeScale: 0.985,
} as const;

/**
 * 結果の発表の段取り（秒）。見出しと相性度は画面の中央で見せてから、元の位置へ移る。
 * ため（見出しだけが中央）→ 見出しが上へ → 相性度だけが中央で数え上げと判 → 相性度が下へ → 名前を打つ → ほかの区画
 */
export const REVEAL = {
  /** ため。見出しだけを画面の中央で見せる（16 コマ） */
  hold: TICK * 16,
  /** ための間に記号を差し替える間隔（3 コマ） */
  glyphEvery: FRAME * 3,
  /** 見出しが中央から元の位置へ移る（8 コマ。SPRING.travel が 7 コマで着く） */
  rise: TICK * 8,
  /** 相性度の数え上げ。12fps のコマで数字を差し替える（20 コマ） */
  count: TICK * 20,
  /** 数え上げの後、最終値で止める（3 コマ）。判のためと止めがこの後に続く */
  countHold: TICK * 3,
  /** 称号の判の全体（19 コマ） */
  seal: TICK * SEAL_TOTAL,
  /** 判を収めてから、相性度が下へ移り始めるまで（3 コマ） */
  sealHold: TICK * 3,
  /** 相性度が中央から元の位置へ移る（8 コマ）。着いたところで名前を打つ */
  drop: TICK * 8,
  /** 名前・理念・ほかの区画を、上から何秒ずつずらすか（2 コマ） */
  stagger: TICK * 2,
} as const;

/**
 * CSS の animation と transition で使う動きの時間（秒）。applyMotionVars が :root に --motion-* として書き込む。
 * CSS には値を書かず、var(--motion-*) で読むだけにする
 */
export const CSS_MOTION = {
  /** 12fps の 1 コマ。記号の差し替えは steps() でこの長さずつ進める */
  frame: FRAME,
  /** 選んだカードの印を描き込む（3 コマ） */
  mark: FRAME * 3,
  /** 結果の発表の後半で、ほかの区画を出す opacity */
  fade: 0.15,
  "fade-delay": 0.16,
  /** reduced motion のとき、結果の発表を一度に出す opacity */
  "fade-reveal": FADE.reveal.duration,
  /** ガラスの上のボタンの塗り。押すと速く透明なガラスに変わり、離すと SPRING.glassRelease と同じ長さで戻る */
  "glass-fill-in": 0.12,
  "glass-fill-out": SPRING.glassRelease.visualDuration,
} as const;

/** CSS_MOTION を :root の CSS カスタムプロパティ（ms）として書き込む。描画の前に 1 回呼ぶ */
export function applyMotionVars(root: HTMLElement = document.documentElement) {
  for (const [name, seconds] of Object.entries(CSS_MOTION)) {
    root.style.setProperty(`--motion-${name}`, `${Math.round(seconds * 1000 * 10) / 10}ms`);
  }
}

/** 数え上げの減速（easeOutCubic）。12fps に量子化して使う */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
