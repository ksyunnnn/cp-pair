// 動きの値（テーマ「判を押して、止まる」）。動きの時間・spring・easing はここと tokens.css の「動き」だけに書く。
// - 操作の層（ボタン・トースト）: Apple の spring。bounce は 0〜0.15（WWDC23 Animate with springs https://developer.apple.com/videos/play/wwdc2023/10158/ ）
// - コンテンツの層（画面・カード・結果）: 速く打って、着地したら止める。着地の後は動かさない
// - 記号の差し替え: 12fps のコマ打ち（LOVE DEATH + ROBOTS の title animation の「frames hold slightly too long」https://luckydumpling.github.io/motion-archive/entries/love-death-robots-title-animation/ ）
// reduced motion では MotionConfig reducedMotion="user" が transform を止め、opacity だけが残る（https://motion.dev/docs/react-accessibility ）
import type { Transition } from "motion/react";

/** 12fps の 1 コマ（秒）。tokens.css の --motion-frame と同じ */
export const FRAME = 1 / 12;

export const SPRING = {
  /** ボタンを押した瞬間（縮む） */
  press: { type: "spring", visualDuration: 0.1, bounce: 0 },
  /** ボタンを離したとき（戻る） */
  release: { type: "spring", visualDuration: 0.3, bounce: 0.15 },
  /** 画面が入る */
  enter: { type: "spring", visualDuration: 0.32, bounce: 0 },
  /** 一覧に行が加わる */
  row: { type: "spring", visualDuration: 0.25, bounce: 0.1 },
  /** 選んだカードの押印 */
  stamp: { type: "spring", visualDuration: 0.22, bounce: 0.2 },
  /** 結果の称号の判。強い弾みはここだけ */
  seal: { type: "spring", visualDuration: 0.18, bounce: 0.3 },
  /** 結果の名前と理念が出る */
  settle: { type: "spring", visualDuration: 0.3, bounce: 0 },
  /** ガラスの上のボタンを押した瞬間（膨らんで浮く）。gel のように少し行き過ぎる */
  glassPress: { type: "spring", visualDuration: 0.16, bounce: 0.3 },
  /** ガラスの上のボタンを押したまま指を動かしたとき（指へ寄って伸びる） */
  glassFollow: { type: "spring", visualDuration: 0.15, bounce: 0 },
  /** ガラスの上のボタンを離したとき（大きさ・位置が元に戻る） */
  glassRelease: { type: "spring", visualDuration: 0.4, bounce: 0.25 },
  /** トーストが出る */
  toast: { type: "spring", visualDuration: 0.3, bounce: 0.15 },
} as const satisfies Record<string, Transition>;

export const FADE = {
  /** reduced motion のとき、動きの代わりに残す opacity */
  quick: { duration: 0.15, ease: "easeOut" },
  /** 結果の発表を reduced motion で一度に出す */
  reveal: { duration: 0.2, ease: "easeOut" },
  /** トーストが消える */
  out: { duration: 0.2, ease: "easeIn" },
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
  cardScale: 1.04,
  cardRotate: -1.5,
  sealScale: 1.15,
  sealRotate: -2,
} as const;

/** 結果の発表の段取り（秒） */
export const REVEAL = {
  /** ため。少し長すぎるくらい止める */
  hold: 1.2,
  /** ための間に記号を差し替える間隔（3 コマ） */
  glyphEvery: FRAME * 3,
  /** 相性度の数え上げ。12fps のコマで数字を差し替える */
  count: 1.0,
  /** 数え上げの後、最終値で止める */
  countHold: 0.4,
  /** 判を打ってから、名前と理念が出るまで */
  afterSeal: 0.2,
  /** 名前・理念・ほかの区画を、上から何秒ずつずらすか */
  stagger: 0.08,
} as const;

/** 数え上げの減速（easeOutCubic）。12fps に量子化して使う */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
