// 診断の説明（#/rules）。結果画面に出る相性度・キャラ型・タグ・称号が何から決まるかを、src/game/explain.ts の中身で並べる。
// ルームに依存しない。結果画面の最後と about ページからリンクする。Framer に画面はなく、部品と文字の組は結果画面の区画に揃える。
import { Heart, Intersect, Sparkle } from "@phosphor-icons/react";
import {
  archetypeRules,
  commonTagRules,
  PARAM_LABELS,
  presetTagRules,
  titleRules,
  type TagRule,
} from "../game/explain.ts";
import { tagIcon, type TagIcon } from "../game/present.ts";
import { navigate } from "../router.ts";
import { COLOR } from "../styles/tokens.ts";
import { BrandHeader, Button, ScreenMain, Section } from "../ui/components.tsx";

/** 診断の説明の経路。about ページからもこの経路へリンクする */
export const RULES_PATH = "/rules";

function PhIcon({ name }: { name: TagIcon }) {
  const props = { size: 14, color: COLOR.ink, weight: "regular" as const, style: { display: "block", flexShrink: 0 } };
  if (name === "Sparkle") return <Sparkle {...props} />;
  if (name === "Heart") return <Heart {...props} />;
  return <Intersect {...props} />;
}

/** 結果画面の札（.r-tag）と同じ形。お題のタグは Sparkle、非上場は Heart、ほかは Intersect（present.ts の tagIcon） */
function TagChip({ tag, isTheme }: { tag: string; isTheme: boolean }) {
  return (
    <span className="r-tag">
      <PhIcon name={isTheme ? "Sparkle" : tagIcon(tag, "")} />
      <span className="t-chip">{tag}</span>
    </span>
  );
}

function TagItem({ rule, isTheme, theme }: { rule: TagRule; isTheme: boolean; theme?: string }) {
  return (
    <li className="rl-item">
      {theme && <p className="t-small c-muted">{theme}</p>}
      <div className="rl-item__head">
        <TagChip tag={rule.tag} isTheme={isTheme} />
        <span className="t-label rl-num">+{rule.points}</span>
      </div>
      <p className="t-small c-muted">{rule.condition}</p>
    </li>
  );
}

/** 結果画面や about から来たときはそこへ戻る。直接開いたときはホストの最初の画面へ */
function back() {
  if (history.length > 1) history.back();
  else navigate("/");
}

export function RulesScreen() {
  return (
    <div className="cp-page">
      <BrandHeader />
      <ScreenMain className="cp-content">
        <div className="cp-heading">
          <h1 className="t-title">診断の説明</h1>
          <p className="t-body c-muted">企業の言葉を借りた、ジョークの相性診断です。</p>
        </div>

        <Section title="3 つの値">
          <p className="t-small c-muted">企業ごとに 1〜5 の値を持つ。相性度の基本点と、お題のタグと称号の判定に使う。</p>
          <ul className="rl-list">
            {PARAM_LABELS.map((p) => (
              <li key={p.key} className="rl-item">
                <p className="t-type">{p.label}</p>
                <p className="t-small c-muted">
                  1: {p.low} 〜 5: {p.high}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="こじつけ相性度">
          <p className="t-body">基本点（52〜90）と、付いたタグの点の合計。50〜100% に収める。</p>
          <p className="t-small c-muted">基本点は、堅実・安定度が近いほど、熱血・野心度とロマン・感性度が離れているほど高い。</p>
        </Section>

        <Section title="キャラ型">
          <p className="t-small c-muted">カルテの診断コメントに次の語が入っているかを上から順に見て、最初に当てはまった型になる。</p>
          <ul className="rl-list">
            {archetypeRules().map((r) => (
              <li key={r.code} className="rl-item">
                <p className="t-type">
                  {r.code} · {r.label}
                </p>
                <p className="t-small c-muted">{r.words.length > 0 ? r.words.join("・") : "どれにも当てはまらない"}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="タグ">
          <p className="t-small c-muted">
            当てはまったものが付き、その点が基本点に足される。お題のタグは、ホストが選んだお題の 1 つだけを見る。
          </p>
          <ul className="rl-list">
            {presetTagRules().map((r) => (
              <TagItem key={r.tag} rule={r} isTheme theme={r.theme} />
            ))}
            {commonTagRules().map((r) => (
              <TagItem key={r.tag} rule={r} isTheme={false} />
            ))}
          </ul>
        </Section>

        <Section title="称号">
          <p className="t-small c-muted">上から順に見て、最初に当てはまった称号になる。</p>
          <ol className="rl-list">
            {titleRules().map((r) => (
              <li key={r.condition} className="rl-item">
                <p className="t-small c-muted">{r.condition}</p>
                {r.titles.map((t) => (
                  <div key={t.title} className="rl-title">
                    {t.tag && <TagChip tag={t.tag} isTheme />}
                    <p className="t-type">{t.title}</p>
                  </div>
                ))}
              </li>
            ))}
          </ol>
        </Section>

        <Button kind="secondary" onClick={back}>
          戻る
        </Button>
      </ScreenMain>
    </div>
  );
}
