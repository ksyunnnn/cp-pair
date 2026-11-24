// 参加者の結果画面。Framer のページ「CP PAIR — あなたの結果」（ブレイクポイント WQLkyLRf1）を再現する。
import { Heart, Intersect, Sparkle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { getPreset } from "../game/presets.ts";
import { TRIGGER_CONFIG } from "../game/triggers.ts";
import { companyMeta, splitTitle, tagIcon, tagLabel, type TagIcon } from "../game/present.ts";
import type { Archetype, MatchedPerson, MatchResult, UnmatchedPerson } from "../game/types.ts";
import { BrandHeader, Button } from "../ui/components.tsx";
import { PairLogo } from "../ui/symbols.tsx";

const PHOSPHOR_WEIGHT = "regular" as const;

function PhIcon({ name, size }: { name: TagIcon; size: number }) {
  const props = { size, color: "#22231F", weight: PHOSPHOR_WEIGHT, style: { display: "block", flexShrink: 0 } };
  if (name === "Sparkle") return <Sparkle {...props} />;
  if (name === "Heart") return <Heart {...props} />;
  return <Intersect {...props} />;
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
    <div className="r-you">
      <p className="t-chip c-muted">YOU · あなたが選んだ理念</p>
      <p className="r-you__phrase cp-phrase">{me.company.phrase}</p>
      <p className="t-small c-muted">{me.company.company_name}</p>
    </div>
  );
}

function AboutGame() {
  return (
    <div className="r-about">
      <p className="t-label">理念はまじめ。相性は、こじつけ。</p>
      <p className="t-small c-muted">企業の言葉を借りた、ジョークの相性診断です。結果は当人とホストだけが確認できます。</p>
    </div>
  );
}

function HostBack({ onBack }: { onBack?: () => void }) {
  if (!onBack) return null;
  return (
    <Button kind="secondary" onClick={onBack}>
      ホスト画面に戻る
    </Button>
  );
}

function Frame({ right, children }: { right: ReactNode; children: ReactNode }) {
  return (
    <div className="cp-page r-page">
      <BrandHeader right={right} />
      <main className="r-content">{children}</main>
    </div>
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

  if (pair) {
    const isA = pair.personA.id === participantId;
    const me = isA ? pair.personA : pair.personB;
    const partner = isA ? pair.personB : pair.personA;
    const myArch = isA ? pair.evaluation.archetypes.personA : pair.evaluation.archetypes.personB;
    const partnerArch = isA ? pair.evaluation.archetypes.personB : pair.evaluation.archetypes.personA;
    const title = splitTitle(pair.evaluation.title);

    return (
      <Frame right="ふたりだけの結果">
        <section className="r-partner" aria-label="あなたのマッチ相手">
          <div className="cp-eyebrow">
            <PhIcon name="Intersect" size={17} />
            <span className="t-eyebrow">YOUR PHILOSOPHY PARTNER</span>
          </div>
          <div className="r-name">
            <h1 className="t-name r-name__text">{partner.name}</h1>
            <span className="t-body">さん</span>
            <span className="r-name__mark">
              <PairLogo width={54} />
            </span>
          </div>
          <div className="r-phrase-card">
            <p className="t-small r-on-ink">{partner.name}さんが選んだ理念</p>
            <p className="r-phrase-card__phrase cp-phrase">{partner.company.phrase}</p>
            <p className="t-small r-on-ink">{partner.company.company_name}</p>
          </div>
          <div className="r-score">
            <div className="r-score__num">
              <p className="t-score c-accent">{pair.evaluation.score}%</p>
              <p className="t-tiny c-muted">こじつけ相性度</p>
            </div>
            <div className="r-score__title">
              {title.kicker && <p className="t-label c-accent">{title.kicker}</p>}
              <p className="t-strong">{title.body}</p>
            </div>
          </div>
        </section>

        <section className="r-talk" aria-label="話しかけるきっかけ">
          <div className="r-talk__head">
            <PhIcon name="Sparkle" size={18} />
            <p className="t-label">まずは、こんな話から。</p>
          </div>
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

        <section className="r-karte" aria-label="ふたりの診断カルテ">
          <h2 className="t-strong">ふたりの診断カルテ</h2>
          <Karte heading={`${partner.name}さん`} person={partner} arch={partnerArch} />
          <Karte heading="あなた" person={me} arch={myArch} />
        </section>

        <AboutGame />
        <HostBack onBack={onBackToHost} />
      </Frame>
    );
  }

  if (unmatched) {
    return <FreeResult me={unmatched} onBackToHost={onBackToHost} />;
  }

  return (
    <Frame right="結果">
      <p className="t-body">この端末の参加者は、今回の結果に含まれていません。</p>
      <HostBack onBack={onBackToHost} />
    </Frame>
  );
}

/* フリー／ジョーカー枠。結果画面と同じ部品と余白で組む（Framer に画面はない）。 */
function FreeResult({ me, onBackToHost }: { me: UnmatchedPerson; onBackToHost?: () => void }) {
  return (
    <Frame right="あなたの結果">
      <section className="r-partner" aria-label="フリー／ジョーカー枠">
        <div className="cp-eyebrow">
          <PhIcon name="Sparkle" size={17} />
          <span className="t-eyebrow">FREE / JOKER</span>
        </div>
        <div className="r-name">
          <h1 className="t-name r-name__text">フリー枠</h1>
          <span className="r-name__mark">
            <PairLogo width={54} />
          </span>
        </div>
        <div className="r-free-note">
          <p className="t-label c-accent">今回はフリー／ジョーカー枠！</p>
          <p className="t-strong">全員と自由にトークできる特権ポジションです</p>
          <p className="t-body c-muted">{me.reason}</p>
        </div>
      </section>

      <YouCard me={me} />

      <section className="r-karte" aria-label="あなたの診断カルテ">
        <h2 className="t-strong">あなたの診断カルテ</h2>
        <Karte heading="あなた" person={me} arch={TRIGGER_CONFIG.personalityArchetype.classify(me.company)} />
      </section>

      <AboutGame />
      <HostBack onBack={onBackToHost} />
    </Frame>
  );
}
