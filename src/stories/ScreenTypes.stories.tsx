import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { RESPONSIVE_VIEWPORT_VALUE } from "storybook/viewport";
import {
  Badge,
  BrandHeader,
  Button,
  FloatingBar,
  GenderSelect,
  NicknameInput,
  ParticipantRow,
  ScreenHeading,
  Section,
  TopLinkFooter,
} from "../ui/components.tsx";
import { CpSymbol } from "../ui/symbols.tsx";

// 画面の型 6 つを、状態ごとに横に並べる。中身はダミー。画面そのものの見本ではなく、余白と構成の見本。
// 状態は UI Stack（Scott Hurff https://www.scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack/ ）の 5 つと、
// このアプリに固有のオフライン（ホストの端末だけで進める）。決まりは DESIGN.md の Layout にある
const meta = {
  title: "レイアウト/画面の型",
  parameters: { layout: "fullscreen" },
  // 6 つの端末を横に並べるため、幅を iPhone に絞らない
  globals: { viewport: { value: RESPONSIVE_VIEWPORT_VALUE, isRotated: false } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const STATES = ["理想", "空", "読み込み中", "一部だけ", "失敗", "オフライン"] as const;
type State = (typeof STATES)[number];

const noop = () => {};
const spark = <CpSymbol name="Spark" size={14} />;

/* 1 台の端末。transform で、画面の下に固定する部品（操作バー）をこの枠の中に留める */
function Device({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="sb-device-wrap">
      <figcaption className="t-label">{label}</figcaption>
      <div className="sb-device">{children}</div>
    </figure>
  );
}

function Screens({ render }: { render: (s: State) => ReactNode }) {
  return (
    <div className="sb-devices">
      {STATES.map((s) => (
        <Device key={s} label={s}>
          {render(s)}
        </Device>
      ))}
    </div>
  );
}

/* 状態ごとの共通のかたまり（ダミー） */
const Skeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="cp-stack" aria-label="読み込み中">
    {Array.from({ length: lines }, (_, i) => (
      <div key={i} className="sb-skeleton" />
    ))}
  </div>
);
const Empty = ({ children }: { children: string }) => <p className="t-body c-muted">{children}</p>;
const Failed = () => (
  <div className="cp-card">
    <p className="t-section">読み込めませんでした（ダミー）</p>
    <Button kind="secondary">もう一度</Button>
  </div>
);
const OfflineBadge = ({ s }: { s: State }) => (s === "オフライン" ? <Badge>ホストの端末だけで進行中（ダミー）</Badge> : null);

/* 1. 1 列の読む画面: 見出し → 区画の積み重ね → フッター */
export const Reading: Story = {
  name: "1 列の読む画面",
  render: () => (
    <Screens
      render={(s) => (
        <div className="cp-page">
          <BrandHeader right={<OfflineBadge s={s} />} />
          <main className="cp-content">
            <ScreenHeading eyebrow="READ" icon={spark} title="ダミーの見出し" lead="ダミーの補足" />
            {s === "読み込み中" && <Skeleton lines={5} />}
            {s === "空" && <Empty>まだ載せる文がありません（ダミー）</Empty>}
            {s === "失敗" && <Failed />}
            {(s === "理想" || s === "一部だけ" || s === "オフライン") && (
              <>
                <Section title="ダミーの区画 1">
                  <p className="t-body">ダミーの本文。二行になるくらいの長さの文を入れて、行の間を確かめる。</p>
                </Section>
                {s === "一部だけ" ? (
                  <Skeleton />
                ) : (
                  <Section title="ダミーの区画 2">
                    <p className="t-body">ダミーの本文。</p>
                  </Section>
                )}
              </>
            )}
          </main>
          <TopLinkFooter />
        </div>
      )}
    />
  ),
};

const NAMES = ["アオイ", "ハルト", "ユイ", "ソウタ"];

/* 2. 一覧: 見出し → 行の積み重ね → 下に浮いた操作バー */
export const List: Story = {
  name: "一覧",
  render: () => (
    <Screens
      render={(s) => (
        <div className="cp-page">
          <BrandHeader right={<OfflineBadge s={s} />} />
          <main className="cp-content has-floating">
            <ScreenHeading eyebrow="LIST" icon={spark} title="ダミーの一覧" />
            <Section title="参加者" aside={s === "読み込み中" || s === "失敗" ? undefined : s === "空" ? "0 人" : s === "一部だけ" ? "1 人" : `${NAMES.length} 人`}>
              {s === "読み込み中" && <Skeleton lines={4} />}
              {s === "空" && <Empty>まだ誰もいません（ダミー）</Empty>}
              {s === "失敗" && <Failed />}
              {(s === "理想" || s === "一部だけ" || s === "オフライン") &&
                NAMES.slice(0, s === "一部だけ" ? 1 : NAMES.length).map((n, i) => (
                  <ParticipantRow
                    key={n}
                    name={n}
                    gender={i % 2 ? "M" : "F"}
                    joinType={s === "オフライン" ? "manual" : "device"}
                    status={i === 0 ? "完了" : "選択中"}
                    done={i === 0}
                  />
                ))}
            </Section>
          </main>
          <FloatingBar note="ダミーの補足">
            <Button disabled={s !== "理想" && s !== "オフライン"}>次へ</Button>
          </FloatingBar>
        </div>
      )}
    />
  ),
};

/* 3. 一覧 → 詳細: 一覧へ戻る文字リンク → 見出し → 区画 */
export const Detail: Story = {
  name: "一覧 → 詳細",
  render: () => (
    <Screens
      render={(s) => (
        <div className="cp-page">
          <BrandHeader right={<OfflineBadge s={s} />} />
          <main className="cp-content">
            {/* 本体の文字リンク（.cp-link。TopLinkFooter と同じ）。左端を見出しと揃える */}
            <a className="t-small cp-link sb-fit" href="#">
              ← 一覧に戻る
            </a>
            {s === "読み込み中" ? (
              <Skeleton lines={6} />
            ) : s === "失敗" ? (
              <Failed />
            ) : (
              <>
                <ScreenHeading eyebrow="DETAIL" icon={spark} title="アオイ" lead="女性・自分の端末（ダミー）" />
                <Section title="選んだもの">
                  {s === "空" ? (
                    <Empty>まだ選んでいません（ダミー）</Empty>
                  ) : s === "一部だけ" ? (
                    <Skeleton lines={2} />
                  ) : (
                    <div className="cp-card cp-card--soft">
                      <p className="t-small c-muted">ダミーの分類</p>
                      <p className="t-section">ダミーの選択肢</p>
                    </div>
                  )}
                </Section>
              </>
            )}
          </main>
          <TopLinkFooter />
        </div>
      )}
    />
  ),
};

/* 4. フォーム: 見出し → 入力欄の積み重ね → 下に浮いた送るボタン */
export const Form: Story = {
  name: "フォーム",
  render: () => (
    <Screens
      render={(s) => (
        <div className="cp-page">
          <BrandHeader right={<OfflineBadge s={s} />} />
          <main className="cp-content has-floating">
            <ScreenHeading eyebrow="FORM" icon={spark} title="ダミーの入力" lead="ダミーの補足" />
            {s === "読み込み中" ? (
              <Skeleton lines={4} />
            ) : (
              <div className="cp-stack cp-stack--16">
                <NicknameInput value={s === "空" ? "" : "アオイ"} onChange={noop} />
                <GenderSelect value={s === "空" || s === "一部だけ" ? null : "F"} onChange={noop} />
                {s === "失敗" && <p className="t-small c-accent-text">送れませんでした。もう一度押してください（ダミー）</p>}
              </div>
            )}
          </main>
          <FloatingBar>
            <Button disabled={s === "空" || s === "一部だけ" || s === "読み込み中"}>参加する</Button>
          </FloatingBar>
        </div>
      )}
    />
  ),
};

const STATUS: Record<State, { symbol: "Done" | "Talk" | "Secret" | "Spark" | "Pair" | "Person"; title: string; lead: string }> = {
  理想: { symbol: "Done", title: "できました", lead: "ダミーの補足" },
  空: { symbol: "Talk", title: "まだ何もありません", lead: "ダミーの補足" },
  読み込み中: { symbol: "Spark", title: "読み込み中", lead: "ダミーの補足" },
  一部だけ: { symbol: "Person", title: "あと 2 人を待っています", lead: "ダミーの補足" },
  失敗: { symbol: "Secret", title: "開けませんでした", lead: "ダミーの補足" },
  オフライン: { symbol: "Pair", title: "ホストの端末だけで進めます", lead: "ダミーの補足" },
};

/* 5. 状態の画面: 記号 → 見出し → 補足 → 操作。本文の代わりに状態だけを伝える */
export const Status: Story = {
  name: "状態の画面",
  render: () => (
    <Screens
      render={(s) => (
        <div className="cp-page">
          <BrandHeader />
          <main className="cp-content">
            <div className="cp-stack cp-stack--16">
              <CpSymbol name={STATUS[s].symbol} size={56} />
              <h1 className="t-title">{STATUS[s].title}</h1>
              <p className="t-body c-muted">{STATUS[s].lead}</p>
              {s !== "読み込み中" && <Button kind="secondary">ダミーの操作</Button>}
            </div>
          </main>
          <TopLinkFooter />
        </div>
      )}
    />
  ),
};

/* 6. 全画面の中央寄せ: 主役を画面の真ん中に、操作を下に（Cover） */
export const Centered: Story = {
  name: "全画面の中央寄せ",
  render: () => (
    <Screens
      render={(s) => (
        <div className="cp-page">
          <div className="sb-l-cover__principal">
            {s === "読み込み中" ? (
              <div className="sb-skeleton" style={{ width: 160, height: 160 }} />
            ) : s === "失敗" ? (
              <Failed />
            ) : (
              <>
                <CpSymbol name={s === "空" ? "Talk" : "Pair"} size={96} />
                <p className="t-title">{s === "空" ? "まだ始まっていません" : "ダミーの主役"}</p>
                {s === "一部だけ" && <p className="t-body c-muted">2 / 4 人（ダミー）</p>}
                <OfflineBadge s={s} />
              </>
            )}
          </div>
          <FloatingBar>
            <Button disabled={s === "読み込み中" || s === "失敗"}>ダミーの操作</Button>
          </FloatingBar>
        </div>
      )}
    />
  ),
};
