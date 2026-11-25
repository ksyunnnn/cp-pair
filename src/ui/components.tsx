// Framer の部品 10 個を React にしたもの。値は docs/design/framer-values.md の「部品」による。
import { animate, m, useMotionValue, useReducedMotion, type MotionValue, type Variants } from "motion/react";
import { createContext, useContext, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Gender, JoinType } from "../game/types.ts";
import { aboutEntry } from "../router.ts";
import { FADE, GLASS_PRESS, OFFSET, PRESS_SCALE, SPRING, STAMP } from "../styles/motion.ts";
import { CpSymbol, PairLogo, type SymbolName } from "./symbols.tsx";

/* FloatingBar の中のボタンは Liquid Glass の押し方にする（WWDC25 Meet Liquid Glass https://developer.apple.com/videos/play/wwdc2025/219/ ） */
const OnGlass = createContext(false);

/* CP 主ボタン / CP 副ボタン / CP 文字リンクボタン */
export function Button({
  kind = "primary",
  children,
  onClick,
  disabled,
  type = "button",
  icon,
  className,
}: {
  kind?: "primary" | "secondary" | "link";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: SymbolName;
  className?: string;
}) {
  const onGlass = useContext(OnGlass);
  if (onGlass) {
    return (
      <GlassButton kind={kind} onClick={onClick} disabled={disabled} type={type} icon={icon} className={className}>
        {children}
      </GlassButton>
    );
  }
  return (
    // 押した瞬間に縮み、離すと spring で戻る（操作の層の動き）。reduced motion では縮みが止まり、:active の薄まりだけが残る
    <m.button
      type={type}
      className={`cp-button cp-button--${kind} t-label${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: PRESS_SCALE, transition: SPRING.press }}
      transition={SPRING.release}
    >
      {icon && <CpSymbol name={icon} size={14} color="currentColor" eyeColor="var(--cp-soft)" />}
      <span>{children}</span>
    </m.button>
  );
}

/* 0 から離れるほど上限 max に近づく（指から離れても上限で止まる） */
const damp = (d: number, max: number) => max * Math.tanh((d * GLASS_PRESS.follow) / max);

function to(value: MotionValue<number>, target: number, transition: (typeof SPRING)[keyof typeof SPRING]) {
  animate(value, target, transition);
}

/*
 * FloatingBar の中のボタン（iOS 26.3 Safari の segmented control の thumb の押し方）。
 * 押すと塗りが透明なガラスに変わり（app.css の [data-pressed]）、膨らんで浮く。押したまま動かすと指へ寄って伸び、離すと spring で戻る。
 * 動きは motion value に直接書き、指を動かすたびに React を描き直さない。reduced motion では塗りの変化だけを残す
 */
function GlassButton({
  kind,
  children,
  onClick,
  disabled,
  type,
  icon,
  className,
}: {
  kind: "primary" | "secondary" | "link";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type: "button" | "submit";
  icon?: SymbolName;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);

  const press = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || origin.current) return;
    origin.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.dataset.pressed = "";
    if (reduced) return;
    to(scaleX, GLASS_PRESS.scale, SPRING.glassPress);
    to(scaleY, GLASS_PRESS.scale, SPRING.glassPress);
  };

  const follow = (e: PointerEvent<HTMLButtonElement>) => {
    const o = origin.current;
    if (!o || o.id !== e.pointerId || reduced) return;
    const tx = damp(e.clientX - o.x, GLASS_PRESS.maxX);
    const ty = damp(e.clientY - o.y, GLASS_PRESS.maxY);
    const nx = Math.abs(tx) / GLASS_PRESS.maxX;
    const ny = Math.abs(ty) / GLASS_PRESS.maxY;
    to(x, tx, SPRING.glassFollow);
    to(y, ty, SPRING.glassFollow);
    to(scaleX, GLASS_PRESS.scale + GLASS_PRESS.stretch * nx - GLASS_PRESS.squash * ny, SPRING.glassFollow);
    to(scaleY, GLASS_PRESS.scale + GLASS_PRESS.stretch * ny - GLASS_PRESS.squash * nx, SPRING.glassFollow);
  };

  const release = (e: PointerEvent<HTMLButtonElement>) => {
    const o = origin.current;
    if (!o || o.id !== e.pointerId) return;
    origin.current = null;
    delete e.currentTarget.dataset.pressed;
    if (reduced) return;
    for (const [v, rest] of [[x, 0], [y, 0], [scaleX, 1], [scaleY, 1]] as const) to(v, rest, SPRING.glassRelease);
  };

  return (
    <m.button
      type={type}
      className={`cp-button cp-button--${kind} t-label${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={{ x, y, scaleX, scaleY }}
      onPointerDown={press}
      onPointerMove={follow}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      {icon && <CpSymbol name={icon} size={14} color="currentColor" eyeColor="var(--cp-soft)" />}
      <span>{children}</span>
    </m.button>
  );
}

/* 画面の本文。入るときに下から打ち込み、着地したら止まる。出るときは動かさずに消す（次の画面を待たせない） */
export function ScreenMain({ className, children }: { className: string; children: ReactNode }) {
  return (
    <m.main
      className={className}
      initial={{ opacity: 0, y: OFFSET.enterY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ y: SPRING.enter, opacity: FADE.quick }}
    >
      {children}
    </m.main>
  );
}

/* CP ニックネーム入力 */
export function NicknameInput({
  value,
  onChange,
  placeholder = "例：アオイ",
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="cp-field">
      <span className="t-label">ニックネーム</span>
      <input
        className="cp-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={12}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        autoFocus={autoFocus}
      />
    </label>
  );
}

/* CP 性別選択 */
export function GenderSelect({ value, onChange }: { value: Gender | null; onChange: (value: Gender) => void }) {
  const options: { value: Gender; label: string }[] = [
    { value: "M", label: "男性" },
    { value: "F", label: "女性" },
  ];
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const step = steps[e.key];
    if (!step) return;
    e.preventDefault();
    const current = options.findIndex((o) => o.value === value);
    const next = (Math.max(current, 0) + step + options.length) % options.length;
    onChange(options[next].value);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };
  return (
    <div className="cp-field">
      <span className="t-label" id="gender-label">
        性別
      </span>
      {/* 矢印キーで選び替え、Tab では選んだ 1 つにだけ止まる（W3C APG Radio Group https://www.w3.org/WAI/ARIA/apg/patterns/radio/ ） */}
      <div className="cp-gender" role="radiogroup" aria-labelledby="gender-label" onKeyDown={onKeyDown}>
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            tabIndex={value === o.value || (value === null && i === 0) ? 0 : -1}
            className={`cp-gender__option t-label${value === o.value ? " is-selected" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* 選んだカードの押印: 少し大きく傾いた所から元より少し下まで打ち込み、0° で収める。選び外したときは動かさない */
const CARD_VARIANTS: Variants = {
  stamped: {
    scale: [OFFSET.cardScale, OFFSET.cardStrikeScale, 1],
    rotate: [OFFSET.cardRotate, 0, 0],
    transition: STAMP.card,
  },
  rest: { scale: 1, rotate: 0 },
};

/* CP 選択肢カード（お題と企業理念で共通） */
export function ChoiceCard({
  category,
  label,
  selected,
  onClick,
}: {
  category: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <m.button
      type="button"
      className={`cp-choice${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
      variants={CARD_VARIANTS}
      initial={false}
      animate={selected ? "stamped" : "rest"}
    >
      <span className="cp-choice__head">
        <span className="t-small cp-choice__category">{category}</span>
        {selected && (
          <span className="cp-choice__mark">
            {/* 印は 3 コマで左から描き込む（app.css の .cp-choice__mark svg） */}
            <CpSymbol name="Done" size={16} />
          </span>
        )}
      </span>
      <span className="t-section cp-choice__label">{label}</span>
    </m.button>
  );
}

/* CP バッジ */
export function Badge({ children }: { children: ReactNode }) {
  return <span className="cp-badge t-small">{children}</span>;
}

export const GENDER_LABEL: Record<Gender, string> = { M: "男性", F: "女性" };
export const JOIN_LABEL: Record<JoinType, string> = { device: "自分の端末", manual: "ホストの端末" };

/* CP 参加者の行 */
export function ParticipantRow({
  name,
  gender,
  joinType,
  status,
  done,
  action,
  onAction,
  onRemove,
  entering,
}: {
  name: string;
  gender: Gender;
  joinType: JoinType;
  status: string;
  done: boolean;
  action?: string;
  onAction?: () => void;
  onRemove?: () => void;
  /** 一覧に後から加わった行。上から打ち込んで止まる */
  entering?: boolean;
}) {
  const removeButton = onRemove && (
    <button type="button" className="cp-row__remove" aria-label={`${name}さんを削除`} onClick={onRemove}>
      <CpSymbol name="Remove" size={16} />
    </button>
  );
  return (
    <m.div
      className="cp-row"
      initial={entering ? { opacity: 0, y: OFFSET.rowY } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ y: SPRING.row, opacity: FADE.quick }}
    >
      <div className="cp-row__info">
        <CpSymbol name="Person" size={28} />
        <div className="cp-row__text">
          <span className="t-section">{name}</span>
          <span className="cp-row__attrs">
            <span className="t-small c-muted">{GENDER_LABEL[gender]}</span>
            <span className="t-small c-muted">{JOIN_LABEL[joinType]}</span>
          </span>
        </div>
        {/* 操作ボタンがない行は、削除を名前の横に置く（空の行を作らない） */}
        {!action && removeButton}
      </div>
      <span className={`t-label${done ? "" : " c-muted"}`}>{status}</span>
      {action && (
        <div className="cp-row__ops">
          <button type="button" className="cp-row__action t-label" onClick={onAction}>
            {action}
          </button>
          {removeButton}
        </div>
      )}
    </m.div>
  );
}

/* CP 進行ステップ */
const STEPS = ["お題", "参加・選択", "結果"];
export function ProgressSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="cp-steps" aria-label="進行">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        return (
          <li key={label} className={`cp-steps__item${active ? " is-current" : ""}`} aria-current={active ? "step" : undefined}>
            <span className="cp-steps__num t-label">{n}</span>
            <span className="t-small">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* CP フローティング操作バー（操作の層。ここだけガラス） */
export function FloatingBar({ note, children }: { note?: ReactNode; children: ReactNode }) {
  return (
    <div className="cp-floating" role="region" aria-label="操作">
      <div className="cp-floating__bar">
        {note && <p className="t-small c-muted cp-floating__note">{note}</p>}
        <OnGlass.Provider value={true}>{children}</OnGlass.Provider>
      </div>
    </div>
  );
}

/* 結果画面の上部「ブランド」。aboutLink のときは、右端に about へのリンクを置く（トップ画面だけ） */
export function BrandHeader({ right, aboutLink = false }: { right?: ReactNode; aboutLink?: boolean }) {
  return (
    <header className="cp-brand">
      <PairLogo width={30} />
      <span className="t-logo">CP PAIR</span>
      <span className="t-small c-muted cp-brand__right">{right}</span>
      {aboutLink && (
        <a className="t-chip cp-link" href="#/about" onClick={() => (aboutEntry.fromApp = true)}>
          ABOUT
        </a>
      )}
    </header>
  );
}

/* ページの最後のフッター。トップ（お題選び）へ移る文字リンクを置く。操作バーの無い画面にだけ置く */
export function TopLinkFooter() {
  return (
    <footer className="cp-footer">
      <a className="t-small cp-link" href="#/">
        はじめの画面に戻る
      </a>
    </footer>
  );
}

/* 結果画面の「結果ラベル」と同じ形の見出し（記号 + 英字ラベル） */
export function Eyebrow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="cp-eyebrow">
      {icon}
      <span className="t-eyebrow">{children}</span>
    </div>
  );
}

/* 画面の見出し: 英字ラベル・題・補足 */
export function ScreenHeading({
  eyebrow,
  icon,
  title,
  lead,
}: {
  eyebrow: string;
  icon: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div className="cp-heading">
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h1 className="t-title">{title}</h1>
      {lead && <p className="t-body c-muted">{lead}</p>}
    </div>
  );
}

/* 本文の区切り（結果画面の border-top 1px + padding-top 24px の区画） */
export function Section({ title, aside, children }: { title?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="cp-section">
      {(title || aside) && (
        <div className="cp-section__head">
          {title && <h2 className="t-strong">{title}</h2>}
          {aside && <span className="t-small c-muted">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
