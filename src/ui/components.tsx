// Framer の部品 10 個を React にしたもの。値は docs/design/framer-values.md の「部品」による。
import { m, type Variants } from "motion/react";
import { createContext, useContext, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Gender, JoinType } from "../game/types.ts";
import { FADE, GLASS_PRESS, OFFSET, PRESS_SCALE, SPRING } from "../styles/motion.ts";
import { CpSymbol, PairLogo, type SymbolName } from "./symbols.tsx";

/* FloatingBar の中のボタンは Liquid Glass の押し方にする（WWDC25 Meet Liquid Glass https://developer.apple.com/videos/play/wwdc2025/219/ ） */
const OnGlass = createContext(false);

/* 指の位置を --press-x / --press-y に書き、光をそこから広げる */
function markPressPoint(e: PointerEvent<HTMLButtonElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--press-x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--press-y", `${e.clientY - r.top}px`);
}

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
  const press = onGlass
    ? { scaleX: GLASS_PRESS.scaleX, scaleY: GLASS_PRESS.scaleY, transition: SPRING.glassPress }
    : { scale: PRESS_SCALE, transition: SPRING.press };
  return (
    // 押した瞬間に縮み、離すと spring で戻る（操作の層の動き）。reduced motion では縮みが止まり、:active の薄まりだけが残る
    <m.button
      type={type}
      className={`cp-button cp-button--${kind} t-label${className ? ` ${className}` : ""}`}
      onClick={onClick}
      onPointerDown={onGlass ? markPressPoint : undefined}
      disabled={disabled}
      whileTap={disabled ? undefined : press}
      transition={onGlass ? SPRING.glassRelease : SPRING.release}
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

/* 選んだカードの押印: 少し大きく傾いた所から打ち、0° で止まる。選び外したときは動かさない */
const CARD_VARIANTS: Variants = {
  stamped: {
    scale: [OFFSET.cardScale, 1],
    rotate: [OFFSET.cardRotate, 0],
    transition: SPRING.stamp,
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

/* 結果画面の上部「ブランド」 */
export function BrandHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="cp-brand">
      <PairLogo width={30} />
      <span className="t-logo">CP PAIR</span>
      <span className="t-small c-muted cp-brand__right">{right}</span>
    </header>
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
