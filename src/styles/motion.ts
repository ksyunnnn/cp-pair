// 動きの値（テーマ「判を押して、止まる」）。動きの時間・spring・easing はここと tokens.css の「動き」だけに書く。
// - 操作の層（ボタン・トースト）: Apple の spring。bounce は 0〜0.15（WWDC23 Animate with springs https://developer.apple.com/videos/play/wwdc2023/10158/ ）
// - コンテンツの層（画面・カード・結果）: 速く打って、着地したら止める。着地の後は動かさない
// - 記号の差し替え: 12fps のコマ打ち（LOVE DEATH + ROBOTS の title animation の「frames hold slightly too long」https://luckydumpling.github.io/motion-archive/entries/love-death-robots-title-animation/ ）
// - 時間は 24fps のコマ（TICK = 41.7ms）の倍数に揃える。12fps の 1 コマ（FRAME = 83ms）は 24fps の 2 コマ。
//   打つ動きは mcbess のループ（ベースを弾いてうなずく、24fps）を測って合わせた: 上げる 330ms（減速）→ 300ms 止める →
//   2 コマ（83ms）で落とす → 2 コマで収める。速い打ちを遅いためと止めの約 4 倍の速さにし、動くのは 1 か所だけにする。
//   ガラスの上のボタン（glass*）は iOS の実機に合わせた値なので揃えない
// reduced motion では MotionConfig reducedMotion="user" が transform を止め、opacity だけが残る（https://motion.dev/docs/react-accessibility ）
import type { Transition } from "motion/react";

/** 12fps の 1 コマ（秒）。tokens.css の --motion-frame と同じ */
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
} as const satisfies Record<string, Transition>;

/** のぞき見防止の画面の記号がまばたきする間隔（秒） */
export const BLINK_EVERY = 3;

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
} as const;

/** 結果の発表の段取り（秒） */
export const REVEAL = {
  /** ため。少し長すぎるくらい止める（24 コマ） */
  hold: TICK * 24,
  /** ための間に記号を差し替える間隔（3 コマ） */
  glyphEvery: FRAME * 3,
  /** 相性度の数え上げ。12fps のコマで数字を差し替える（20 コマ） */
  count: TICK * 20,
  /** 数え上げの後、最終値で止める（3 コマ）。判のためと止めがこの後に続く */
  countHold: TICK * 3,
  /** 判が動き始めてから、打ち込んだ底に着くまで。名前と理念はここから出る */
  afterSeal: TICK * (SEAL_TICKS.windUp + SEAL_TICKS.hold + SEAL_TICKS.strike),
  /** 名前・理念・ほかの区画を、上から何秒ずつずらすか（2 コマ） */
  stagger: TICK * 2,
} as const;

/** 数え上げの減速（easeOutCubic）。12fps に量子化して使う */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
