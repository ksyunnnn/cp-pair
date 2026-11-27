// 参加者の結果画面。Framer のページ「CP PAIR — あなたの結果」（ブレイクポイント WQLkyLRf1）を再現する。
import { Heart, Intersect, Sparkle } from "@phosphor-icons/react";
import { m } from "motion/react";
import type { ReactNode } from "react";
import { getPreset } from "../game/presets.ts";
import { TRIGGER_CONFIG } from "../game/triggers.ts";
import { companyMeta, splitTitle, splitTitleBody, tagIcon, tagLabel, type TagIcon } from "../game/present.ts";
import type { Archetype, MatchedPerson, MatchResult, UnmatchedPerson } from "../game/types.ts";
import { BrandHeader, Button } from "../ui/components.tsx";
import { PairLogo } from "../ui/symbols.tsx";
import { navigate } from "../router.ts";
import { RULES_PATH } from "./RulesScreen.tsx";
import { useReveal, type Reveal } from "./useReveal.ts";

// ための間に差し替える記号。どれも結果画面にある記号で、最初の 1 つが最後に残る
const PAIR_GLYPHS: TagIcon[] = ["Intersect", "Heart", "Sparkle"];
const FREE_GLYPHS: TagIcon[] = ["Sparkle", "Heart", "Intersect"];

const PHOSPHOR_WEIGHT = "regular" as const;

function PhIcon({ name, size }: { name: TagIcon; size: number }) {
  // アイコンは常に墨で描く。SVG の fill 属性に var() を書く方法は仕様で決まっていないので、currentColor と style の color で渡す
  const props = { size, color: "currentColor", weight: PHOSPHOR_WEIGHT, style: { display: "block", flexShrink: 0, color: "var(--text)" } };
  if (name === "Sparkle") return <Sparkle {...props} />;
  if (name === "Heart") return <Heart {...props} />;
  return <Intersect {...props} />;
}

/* 相性と称号（P74_Bj9RK）。称号の本体は、1 行に収まらないときだけ末尾の語を次の行に送る（行の間は 4px）。
   reveal を渡すと、数え上げの数字と、判で打つ称号になる（参加者の結果画面だけ） */
export function ScoreAndTitle({ score, title, reveal }: { score: number; title: string; reveal?: Reveal }) {
  const t = splitTitle(title);
  const [head, tail] = splitTitleBody(t.body);
  return (
    <m.div className="r-score" {...reveal?.travel("score")}>
      <m.div className="r-score__num" {...reveal?.part("appear")}>
        <p className="t-score c-accent">{reveal ? reveal.score : score}%</p>
        <p className="t-tiny c-muted">こじつけ相性度</p>
      </m.div>
      <m.div className="r-score__title" {...(reveal && { ...reveal.part("seal"), style: { originX: 0 } })}>
        {t.kicker && <p className="t-label c-accent-text">{t.kicker}</p>}
        <p className="t-strong r-title-body">
          <span>{head}</span>
          {tail && <span>{tail}</span>}
        </p>
      </m.div>
    </m.div>
  );
}

function Karte({ heading, person, arch }: { heading: string; person: MatchedPerson; arch: Archetype }) {
  return (
    <div className="r-karte__item">
      <p className="t-small c-muted">{heading}</p>
      <p className="t-type">
        {arch.code} · {arch.label}
      </p>
      <p className="t-small c-muted">{companyMeta(person.company)}</p>
      <p className="t-comment">{person.company.creative.personality_comment}</p>
      <a className="t-small r-source" href={person.company.source_url} target="_blank" rel="noopener noreferrer">
        企業情報の出典
      </a>
    </div>
  );
}

function YouCard({ me }: { me: MatchedPerson }) {
  return (
    <div className="r-you r-later">
      <p className="t-chip c-muted">YOU · あなたが選んだ理念</p>
      <p className="r-you__phrase cp-phrase">{me.company.phrase}</p>
      <p className="t-small c-muted">{me.company.company_name}</p>
    </div>
  );
}

function AboutGame() {
  return (
    <div className="r-about r-later">
      <p className="t-label">理念はまじめ。相性は、こじつけ。</p>
      <p className="t-small c-muted">企業の言葉を借りた、ジョークの相性診断です。結果は当人とホストだけが確認できます。</p>
    </div>
  );
}

/* 診断の説明（/rules）へ。相性度・キャラ型・タグ・称号が何から決まるかを、ルームによらない 1 枚で見せる */
function RulesLink() {
  return (
    <Button kind="link" className="r-later" onClick={() => navigate(RULES_PATH)}>
      診断の説明
    </Button>
  );
}

/* ホストの端末で開いたときはホストの画面へ、参加者の端末ではトップ（最近のルーム）へ戻る（#34） */
function HostBack({ onBack }: { onBack?: () => void }) {
  if (!onBack) {
    return (
      <Button kind="link" className="r-later" onClick={() => navigate("/")}>
        はじめの画面に戻る
      </Button>
    );
  }
  return (
    <Button kind="secondary" className="r-later" onClick={onBack}>
      ホスト画面に戻る
    </Button>
  );
}

/* 発表の途中は、本文を押すと最後の状態へ飛ぶ。途中の区画は押せない（隠れたボタンを押さないように） */
function Frame({
  right,
  reveal,
  homeLink,
  children,
}: {
  right: ReactNode;
  reveal: Reveal;
  homeLink: boolean;
  children: ReactNode;
}) {
  return (
    <div className="cp-page r-page">
      <BrandHeader right={right} homeLink={homeLink} />
      <main
        className="r-content"
        data-revealing={reveal.running || undefined}
        data-later={reveal.later}
        onPointerDown={reveal.running ? reveal.skip : undefined}
      >
        {children}
      </main>
    </div>
  );
}

/* 見出しの記号。ための間は、結果画面にある記号をコマ打ちで差し替える。発表の初めは画面の中央に置き、元の位置へ上げる */
function RevealEyebrow({ glyphs, reveal, children }: { glyphs: TagIcon[]; reveal: Reveal; children: ReactNode }) {
  return (
    <m.div className="cp-eyebrow" {...reveal.travel("eyebrow")}>
      <PhIcon name={glyphs[reveal.glyph]} size={17} />
      <span className="t-eyebrow">{children}</span>
    </m.div>
  );
}

export function ResultScreen({
  result,
  participantId,
  onBackToHost,
}: {
  result: MatchResult;
  participantId: string;
  onBackToHost?: () => void;
}) {
  const preset = getPreset(result.presetId);
  const pair = result.pairs.find((p) => p.personA.id === participantId || p.personB.id === participantId);
  const unmatched = result.unmatched.find((u) => u.id === participantId);
  const reveal = useReveal(`${result.timestamp}:${participantId}`, pair ? pair.evaluation.score : null, PAIR_GLYPHS.length);

  if (pair) {
    const isA = pair.personA.id === participantId;
    const me = isA ? pair.personA : pair.personB;
    const partner = isA ? pair.personB : pair.personA;
    const myArch = isA ? pair.evaluation.archetypes.personA : pair.evaluation.archetypes.personB;
    const partnerArch = isA ? pair.evaluation.archetypes.personB : pair.evaluation.archetypes.personA;
    
    return (
      <Frame right="ふたりだけの結果" reveal={reveal} homeLink={!onBackToHost}>
        <section className="r-partner" aria-label="あなたのマッチ相手">
          <RevealEyebrow glyphs={PAIR_GLYPHS} reveal={reveal}>
            YOUR PHILOSOPHY PARTNER
          </RevealEyebrow>
          <m.div className="r-name" {...reveal.part("strike")} style={{ originX: 0 }}>
            <h1 className="t-name r-name__text">{partner.name}</h1>
            <span className="t-body">さん</span>
            <span className="r-name__mark">
              <PairLogo width={54} />
            </span>
          </m.div>
          <m.div className="r-phrase-card" {...reveal.part("settle", 1)}>
            <p className="t-small r-on-ink">{partner.name}さんが選んだ理念</p>
            <p className="r-phrase-card__phrase cp-phrase">{partner.company.phrase}</p>
            <p className="t-small r-on-ink">{partner.company.company_name}</p>
          </m.div>
          <ScoreAndTitle score={pair.evaluation.score} title={pair.evaluation.title} reveal={reveal} />
        </section>

        <section className="r-talk r-later" aria-label="ひとこと">
          <p className="t-small c-muted">ひとこと</p>
          <p className="t-body">{pair.evaluation.story}</p>
          {pair.evaluation.triggeredTags.length > 0 && (
            <ul className="r-tags">
              {pair.evaluation.triggeredTags.map((tag) => (
                <li key={tag} className="r-tag">
                  <PhIcon name={tagIcon(tag, preset.tagLabel)} size={14} />
                  <span className="t-chip">{tagLabel(tag)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <YouCard me={me} />

        <section className="r-karte r-later" aria-label="ふたりの診断カルテ">
          <h2 className="t-strong">ふたりの診断カルテ</h2>
          <Karte heading={`${partner.name}さん`} person={partner} arch={partnerArch} />
          <Karte heading="あなた" person={me} arch={myArch} />
        </section>

        <AboutGame />
        <RulesLink />
        <HostBack onBack={onBackToHost} />
      </Frame>
    );
  }

  if (unmatched) {
    return <FreeResult me={unmatched} reveal={reveal} onBackToHost={onBackToHost} />;
  }

  return (
    <Frame right="結果" reveal={reveal} homeLink={!onBackToHost}>
      <p className="t-body">この端末の参加者は、今回の結果に含まれていません。</p>
      <HostBack onBack={onBackToHost} />
    </Frame>
  );
}

/* フリー／ジョーカー枠。結果画面と同じ部品と余白で組む（Framer に画面はない）。 */
function FreeResult({ me, reveal, onBackToHost }: { me: UnmatchedPerson; reveal: Reveal; onBackToHost?: () => void }) {
  return (
    <Frame right="あなたの結果" reveal={reveal} homeLink={!onBackToHost}>
      <section className="r-partner" aria-label="フリー／ジョーカー枠">
        <RevealEyebrow glyphs={FREE_GLYPHS} reveal={reveal}>
          FREE / JOKER
        </RevealEyebrow>
        <m.div className="r-name" {...reveal.part("strike")} style={{ originX: 0 }}>
          <h1 className="t-name r-name__text">フリー枠</h1>
          <span className="r-name__mark">
            <PairLogo width={54} />
          </span>
        </m.div>
        <m.div className="r-free-note" {...reveal.part("seal")} style={{ originX: 0 }}>
          <p className="t-label c-accent-text">今回はフリー／ジョーカー枠！</p>
          <p className="t-strong">全員と自由にトークできる特権ポジションです</p>
          <p className="t-body c-muted">{me.reason}</p>
        </m.div>
      </section>

      <YouCard me={me} />

      <section className="r-karte r-later" aria-label="あなたの診断カルテ">
        <h2 className="t-strong">あなたの診断カルテ</h2>
        <Karte heading="あなた" person={me} arch={TRIGGER_CONFIG.personalityArchetype.classify(me.company)} />
      </section>

      <AboutGame />
      <RulesLink />
      <HostBack onBack={onBackToHost} />
    </Frame>
  );
}
